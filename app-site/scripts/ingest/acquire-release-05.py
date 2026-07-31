#!/usr/bin/env python3
"""Generate deterministic Release 0.5 imports from official bulk sources.

Raw workbooks and archives remain ignored. The main import contains searchable
city identities, coordinates, latest estimates, and country area histories.
The city-series import contains the complete WUP 1975-2050 observation history
without duplicating source values in thousands.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import sqlite3
from html.parser import HTMLParser
from zipfile import ZipFile
from xml.etree import ElementTree as ET

RETRIEVED_AT = "2026-07-31"
WUP_BASE = "https://population.un.org/wup/assets/Download/Cities/"
WB_URL = "https://api.worldbank.org/v2/en/indicator/AG.LND.TOTL.K2?downloadformat=csv"
WUP_FILES = {
    "population": "WUP2025-F21-DEGURBA-Cities_Pop.xlsx",
    "land_area": "WUP2025-F25-DEGURBA-Cities_AREA_km2.xlsx",
    "built_up_per_person": "WUP2025-F30-DEGURBA-Cities_BU_m2_per_capita.xlsx",
    "density": "WUP2025-F34-DEGURBA-Cities_Pop_density.xlsx",
}
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


class M49Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(); self.in_table = False; self.in_cell = False
        self.parts: list[str] = []; self.row: list[str] = []; self.rows: list[list[str]] = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "table" and values.get("id", "").strip() == "downloadTableEN": self.in_table = True
        elif self.in_table and tag == "tr": self.row = []
        elif self.in_table and tag in {"td", "th"}: self.in_cell = True; self.parts = []
    def handle_data(self, data):
        if self.in_cell: self.parts.append(data)
    def handle_endtag(self, tag):
        if self.in_table and tag in {"td", "th"}: self.row.append(" ".join("".join(self.parts).split())); self.in_cell = False
        elif self.in_table and tag == "tr" and self.row: self.rows.append(self.row)
        elif self.in_table and tag == "table": self.in_table = False


def m49_iso3_codes(path: Path) -> dict[str, str]:
    parser = M49Parser(); parser.feed(path.read_text(encoding="utf-8-sig"))
    headers = parser.rows[0]
    records = [dict(zip(headers, row)) for row in parser.rows[1:] if len(row) == len(headers)]
    return {row["ISO-alpha3 Code"]: row["M49 Code"] for row in records if row.get("ISO-alpha3 Code")}


def q(value: object | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "unnamed"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def excel_column(reference: str) -> str:
    return "".join(character for character in reference if character.isalpha())


def workbook_rows(path: Path):
    """Yield dictionaries from the WUP workbook's Data sheet using stdlib only."""
    with ZipFile(path) as archive:
        shared: list[str] = []
        strings = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        for item in strings.findall(NS + "si"):
            shared.append("".join(node.text or "" for node in item.iter(NS + "t")))
        headers: dict[str, str] = {}
        stream = archive.open("xl/worksheets/sheet2.xml")
        for _, element in ET.iterparse(stream, events=("end",)):
            if element.tag != NS + "row":
                continue
            values: dict[str, str] = {}
            for cell in element.findall(NS + "c"):
                value_node = cell.find(NS + "v")
                value = "" if value_node is None else (value_node.text or "")
                if cell.attrib.get("t") == "s" and value:
                    value = shared[int(value)]
                values[excel_column(cell.attrib["r"])] = value
            if element.attrib.get("r") == "1":
                headers = values
            else:
                yield {heading: values.get(column, "") for column, heading in headers.items()}
            element.clear()


def load_wup(raw_dir: Path) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, dict[int, float]]]]:
    cities: dict[str, dict[str, str]] = {}
    measures: dict[str, dict[str, dict[int, float]]] = {}
    for measure, filename in WUP_FILES.items():
        measure_rows: dict[str, dict[int, float]] = {}
        for row in workbook_rows(raw_dir / filename):
            city_code = row["City_Code"]
            if not city_code:
                continue
            if measure == "population":
                cities[city_code] = {
                    "country": row["Location"],
                    "loc_id": str(int(float(row["LocID"]))).zfill(3),
                    "iso3": row["ISO3_Code"],
                    "iso2": row["ISO2_Code"],
                    "name": row["City_Name"],
                    "capital": row["Capital"],
                    "longitude": row["PWCent_Longitude"],
                    "latitude": row["PWCent_Latitude"],
                }
            series: dict[int, float] = {}
            for key, value in row.items():
                if key.isdigit() and value:
                    series[int(key)] = float(value)
            measure_rows[city_code] = series
        measures[measure] = measure_rows
    if set(cities) != set(measures["density"]):
        raise RuntimeError("WUP city identities differ between F21 and F34")
    return cities, measures


def load_world_bank(path: Path) -> list[dict[str, str]]:
    with ZipFile(path) as archive:
        data_name = next(
            name for name in archive.namelist()
            if name.startswith("API_AG.LND.TOTL.K2") and name.endswith(".csv")
        )
        with archive.open(data_name) as source:
            text = (line.decode("utf-8-sig") for line in source)
            for line in text:
                if line.startswith('"Country Name"'):
                    return list(csv.DictReader([line, *text]))
    raise RuntimeError("World Bank land-area CSV header not found")


def header_sql(hashes: dict[str, str]) -> list[str]:
    lines = ["PRAGMA foreign_keys = ON;"]
    lines.append(
        "INSERT OR IGNORE INTO units (id,code,canonical_name,symbol) VALUES "
        "('unit_square_metre_per_person','square_metre_per_person','Square metres per person','m²/person');"
    )
    lines.append(
        "INSERT OR IGNORE INTO indicators (id,code,canonical_name,description,domain,measurement_type,default_unit_id,aggregation_rule,comparison_rule,status) VALUES "
        "('ind_city_built_up_area_km2','CITY_BUILT_UP_AREA_KM2','Built-up area','WUP city built-up area derived from source population and built-up area per capita.','land','area','unit_square_kilometre','not additive across overlapping cities','same unit, year, methodology and evidence status','active'),"
        "('ind_built_up_area_per_person','BUILT_UP_AREA_PER_PERSON','Built-up area per person','WUP built-up area per capita.','land','ratio','unit_square_metre_per_person','not additive','same unit, year, methodology and evidence status','active');"
    )
    sources = [(key, WUP_BASE + filename) for key, filename in WUP_FILES.items()]
    sources.append(("world_bank_land", WB_URL))
    lines.append(
        "INSERT OR IGNORE INTO datasets (id,publisher_id,canonical_title,licence,source_url) VALUES "
        f"('ds_wup_2025_cities','pub_un_population','World Urbanization Prospects 2025: Cities','CC BY 3.0 IGO',{q(WUP_BASE)}),"
        f"('ds_world_bank_land_area','pub_world_bank','Land area (sq. km), AG.LND.TOTL.K2','CC BY 4.0',{q(WB_URL)});"
    )
    lines.append(
        "INSERT OR IGNORE INTO dataset_releases (id,dataset_id,edition,version,release_date,retrieved_at,content_hash,status) VALUES "
        f"('rel_wup_2025_cities','ds_wup_2025_cities','2025','Online Edition','2025-11-18',{q(RETRIEVED_AT)},{q('sha256:' + hashes['population'])},'validated'),"
        f"('rel_world_bank_land_2026_07_31','ds_world_bank_land_area','current','API download','2026-07-13',{q(RETRIEVED_AT)},{q('sha256:' + hashes['world_bank_land'])},'validated');"
    )
    for key, url in sources:
        release = "rel_world_bank_land_2026_07_31" if key == "world_bank_land" else "rel_wup_2025_cities"
        lines.append(
            "INSERT OR IGNORE INTO source_assets (id,dataset_release_id,source_url,content_hash,retrieved_at,archive_status) VALUES "
            f"({q('asset_r05_' + key)},{q(release)},{q(url)},{q('sha256:' + hashes[key])},{q(RETRIEVED_AT)},'external_source');"
        )
    return lines


def city_place_id(city_code: str, city: dict[str, str] | None = None) -> str:
    if city and city["capital"] not in {"", "0"}:
        return f"place_capital_{slugify(city['name'])}_{city['iso2'].lower()}"
    return f"place_wup_city_{city_code}"


def city_geo_id(city_code: str) -> str:
    return f"geo_wup_city_{city_code}"


def generate_main(cities, measures, wb_rows, hashes, iso3_to_m49) -> str:
    lines = header_sql(hashes)
    lines.append(
        "INSERT OR IGNORE INTO ingestion_runs (id,connector_code,dataset_id,started_at,completed_at,status,manifest_json) VALUES "
        f"('run_wup_2025_cities','un_wup_2025','ds_wup_2025_cities',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'published','{{\"sourceUnitPopulation\":\"thousand people\",\"canonicalUnitPopulation\":\"people\",\"conversion\":\"multiply by 1000\",\"estimateThrough\":2025,\"projectionFrom\":2026}}'),"
        f"('run_world_bank_land_2026_07_31','world_bank','ds_world_bank_land_area',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'published','{{}}');"
    )
    for code, city in sorted(cities.items(), key=lambda item: int(item[0])):
        pid, gid = city_place_id(code, city), city_geo_id(code)
        slug = f"{slugify(city['name'])}-{city['iso2'].lower()}-wup-{code}"
        parent_id = f"place_m49_{iso3_to_m49[city['iso3']]}" if city["iso3"] in iso3_to_m49 else f"place_wpp_{city['loc_id']}"
        lines.append(
            "INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status,centroid_latitude,centroid_longitude) VALUES "
            f"({q(pid)},{q(slug)},{q(city['name'])},'city',{q(city['iso2'])},{q(parent_id)},'current',{q(city['latitude'])},{q(city['longitude'])});"
        )
        lines.append(f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_wup_city_' + code)},{q(pid)},{q(city['name'])},'official',1);")
        lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_wup_city_' + code)},{q(pid)},'UN Population Division','WUP_CITY_CODE',{q(code)},'rel_wup_2025_cities');")
        lines.append(f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,authority,official_code,valid_from,status) VALUES ({q(gid)},{q(pid)},'city','UN Population Division',{q(code)},'1975-01-01','current');")
        lines.append(f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_wup_city_country_' + code)},{q(pid)},'within',{q(parent_id)},'rel_wup_2025_cities','verified');")
        if city["capital"] not in {"", "0"}:
            lines.append(f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_wup_capital_' + code)},{q(pid)},'current_capital_of',{q(parent_id)},'rel_wup_2025_cities','source_asserted');")
        estimate_years = [year for year in measures["population"][code] if year <= 2025]
        if not estimate_years:
            continue
        latest = max(estimate_years)
        values = {
            "population": measures["population"][code].get(latest),
            "land_area": measures["land_area"][code].get(latest),
            "built_up_per_person": measures["built_up_per_person"][code].get(latest),
            "density": measures["density"][code].get(latest),
        }
        definitions = {
            "population": ("ind_population_total", "unit_people", values["population"] * 1000 if values["population"] is not None else None),
            "land_area": ("ind_land_area_km2", "unit_square_kilometre", values["land_area"]),
            "built_up_per_person": ("ind_built_up_area_per_person", "unit_square_metre_per_person", values["built_up_per_person"]),
            "density": ("ind_population_density_km2", "unit_people_per_square_kilometre", values["density"]),
        }
        for measure, (indicator, unit, value) in definitions.items():
            if value is None:
                continue
            oid = f"obs_wup_city_{code}_{measure}_{latest}"
            lines.append(
                "INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,dataset_release_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES "
                f"({q(oid)},{q(gid)},{q(indicator)},{q(unit)},'rel_wup_2025_cities',{value},{latest},{q(str(latest)+'-07-01')},{q(str(latest)+'-07-01')},'2025-11-18',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',1,'estimate','WUP 2025 DEGURBA city estimate');"
            )
        if values["population"] is not None and values["built_up_per_person"] is not None:
            built = values["population"] * values["built_up_per_person"] / 1000
            lines.append(
                "INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,dataset_release_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES "
                f"({q('obs_wup_city_' + code + '_built_up_area_' + str(latest))},{q(gid)},'ind_city_built_up_area_km2','unit_square_kilometre','rel_wup_2025_cities',{built},{latest},{q(str(latest)+'-07-01')},{q(str(latest)+'-07-01')},'2025-11-18',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',1,'estimate','WUP 2025 F21 × F30 unit derivation');"
            )
    for row in sorted(wb_rows, key=lambda item: item["Country Code"]):
        iso3 = row["Country Code"]
        if not iso3:
            continue
        for year in range(1961, 2024):
            raw = row.get(str(year), "")
            if not raw:
                continue
            lines.append(
                "INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,dataset_release_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) "
                f"SELECT {q('obs_wb_land_' + iso3.lower() + '_' + str(year))},g.id,'ind_land_area_km2','unit_square_kilometre','rel_world_bank_land_2026_07_31',{float(raw)},{year},{q(str(year)+'-01-01')},{q(str(year)+'-12-31')},'2026-07-13',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',0,'reported','World Bank AG.LND.TOTL.K2' FROM geographies g JOIN place_identifiers pi ON pi.place_id=g.place_id WHERE pi.scheme='ISO_ALPHA3' AND pi.identifier={q(iso3)} ORDER BY CASE WHEN g.authority='UNSD' THEN 0 ELSE 1 END,g.id LIMIT 1;"
            )
    for year in range(1961, 2024):
        pairs = (
            "WITH pairs AS (SELECT lower(pi.identifier) AS iso3,pop.id AS pop_id,land.id AS land_id,"
            "pop.geography_id,pop.value_numeric AS population,land.value_numeric AS area "
            "FROM observations pop JOIN observations land ON land.geography_id=pop.geography_id "
            "AND land.reference_year=pop.reference_year AND land.indicator_id='ind_land_area_km2' "
            "AND land.dataset_release_id='rel_world_bank_land_2026_07_31' "
            "JOIN geographies g ON g.id=pop.geography_id JOIN place_identifiers pi ON pi.place_id=g.place_id "
            f"WHERE pop.indicator_id='ind_population_total' AND pop.reference_year={year} "
            "AND pop.evidence_status='estimate' AND pi.scheme='ISO_ALPHA3') "
        )
        lines.append(pairs + "INSERT OR IGNORE INTO calculations (id,calculation_type,formula_code,formula_version,output_indicator_id,executed_at,input_manifest_json,output_value_numeric,output_unit_id) SELECT 'calc_country_density_'||iso3||'_" + str(year) + "','derived_observation','POP_TOTAL / LAND_AREA_KM2','1','ind_population_density_km2'," + q(RETRIEVED_AT) + ",json_array(pop_id,land_id),population/area,'unit_people_per_square_kilometre' FROM pairs;")
        lines.append(pairs + "INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) SELECT 'obs_country_density_'||iso3||'_" + str(year) + "',geography_id,'ind_population_density_km2','unit_people_per_square_kilometre',population/area," + str(year) + "," + q(str(year)+'-01-01') + "," + q(str(year)+'-12-31') + ",'2026-07-13'," + q(RETRIEVED_AT) + "," + q(RETRIEVED_AT) + ",'verified','preferred',1,'estimate','Metroplist country density v1' FROM pairs;")
        lines.append(pairs + "INSERT OR IGNORE INTO calculation_inputs (id,calculation_id,observation_id,input_role) SELECT 'ci_calc_country_density_'||iso3||'_" + str(year) + "_population','calc_country_density_'||iso3||'_" + str(year) + "',pop_id,'population' FROM pairs UNION ALL SELECT 'ci_calc_country_density_'||iso3||'_" + str(year) + "_land_area','calc_country_density_'||iso3||'_" + str(year) + "',land_id,'land_area' FROM pairs;")
        lines.append(pairs + "INSERT OR IGNORE INTO observation_lineage (id,output_observation_id,input_observation_id,calculation_id,input_role) SELECT 'lin_calc_country_density_'||iso3||'_" + str(year) + "_population','obs_country_density_'||iso3||'_" + str(year) + "',pop_id,'calc_country_density_'||iso3||'_" + str(year) + "','population' FROM pairs UNION ALL SELECT 'lin_calc_country_density_'||iso3||'_" + str(year) + "_land_area','obs_country_density_'||iso3||'_" + str(year) + "',land_id,'calc_country_density_'||iso3||'_" + str(year) + "','land_area' FROM pairs;")
    return "\n".join(lines) + "\n"


HISTORY_DEFINITIONS = {
    "population": ("POP_TOTAL", 1000.0),
    "land_area": ("LAND_AREA_KM2", 1.0),
    "built_up_per_person": ("BUILT_UP_AREA_PER_PERSON", 1.0),
    "density": ("POP_DENSITY_KM2", 1.0),
}

HISTORY_PARTITIONS = {
    "estimates": (1975, 2025, "estimate"),
    "projections": (2026, 2050, "projection"),
}


def history_rows(cities, measures, first_year: int, last_year: int, status: str):
    for code in sorted(cities, key=int):
        place_id = city_place_id(code, cities[code])
        for measure, (indicator, multiplier) in HISTORY_DEFINITIONS.items():
            for year, source_value in sorted(measures[measure][code].items()):
                if first_year <= year <= last_year:
                    yield (
                        place_id,
                        indicator,
                        year,
                        source_value * multiplier,
                        status,
                        "rel_wup_2025_cities",
                    )


def write_history_import(
    path: Path,
    cities,
    measures,
    hashes: dict[str, str],
    first_year: int,
    last_year: int,
    status: str,
) -> dict[str, object]:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows_written = 0
    maximum_statement_bytes = 0
    batch: list[tuple[object, ...]] = []

    def write_statement(target, statement: str) -> None:
        nonlocal maximum_statement_bytes
        encoded_bytes = len(statement.encode())
        maximum_statement_bytes = max(maximum_statement_bytes, encoded_bytes)
        if encoded_bytes >= 100_000:
            raise RuntimeError(f"History import statement exceeds D1 limit: {encoded_bytes}")
        target.write(statement + "\n")

    def flush(target) -> None:
        nonlocal rows_written
        if not batch:
            return
        values = ",".join(
            "(" + ",".join(q(value) for value in row) + ")"
            for row in batch
        )
        write_statement(
            target,
            "INSERT OR IGNORE INTO city_observation_series "
            "(place_id,indicator_code,reference_year,value_numeric,"
            "evidence_status,source_release_id) VALUES " + values + ";",
        )
        rows_written += len(batch)
        batch.clear()

    with path.open("w", encoding="utf-8") as target:
        write_statement(target, "PRAGMA foreign_keys = ON;")
        write_statement(
            target,
            "INSERT OR IGNORE INTO history_source_releases "
            "(id,publisher,dataset,release_name,publication_date,retrieved_at) "
            "VALUES ('rel_wup_2025_cities','United Nations Population Division',"
            "'World Urbanization Prospects 2025: Cities','Online Edition',"
            f"'2025-11-18',{q(RETRIEVED_AT)});",
        )
        for measure, (indicator, _) in HISTORY_DEFINITIONS.items():
            write_statement(
                target,
                "INSERT OR IGNORE INTO history_source_assets "
                "(id,source_release_id,indicator_code,source_url,content_hash) "
                f"VALUES ({q('asset_r05_' + measure)},'rel_wup_2025_cities',"
                f"{q(indicator)},{q(WUP_BASE + WUP_FILES[measure])},"
                f"{q('sha256:' + hashes[measure])});",
            )
        for row in history_rows(
            cities,
            measures,
            first_year,
            last_year,
            status,
        ):
            batch.append(row)
            if len(batch) == 200:
                flush(target)
        flush(target)

    return {
        "rows": rows_written,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "maximumStatementBytes": maximum_statement_bytes,
        "path": str(path),
    }


def execute_import(connection: sqlite3.Connection, path: Path) -> None:
    with path.open(encoding="utf-8") as source:
        for line_number, line in enumerate(source, start=1):
            statement = line.strip()
            if not statement:
                continue
            if not statement.endswith(";"):
                raise RuntimeError(f"Unterminated statement in {path}:{line_number}")
            connection.execute(statement)
    connection.commit()


def verify_history_databases(
    directory: Path,
    migration: Path,
    imports: dict[str, Path],
    expected_rows: dict[str, int],
) -> dict[str, object]:
    """Build each history database from its real migration and import twice."""
    directory.mkdir(parents=True, exist_ok=True)
    migration_sql = migration.read_text(encoding="utf-8")
    results: dict[str, object] = {}
    for partition, import_path in imports.items():
        first_year, last_year, status = HISTORY_PARTITIONS[partition]
        path = directory / f"metroplist-city-history-{partition}.sqlite"
        if path.exists():
            path.unlink()
        connection = sqlite3.connect(path)
        connection.execute("PRAGMA journal_mode = OFF")
        connection.execute("PRAGMA synchronous = OFF")
        connection.executescript(migration_sql)
        execute_import(connection, import_path)

        fingerprint_sql = """
          SELECT COUNT(*), MIN(reference_year), MAX(reference_year),
                 COUNT(DISTINCT place_id), COUNT(DISTINCT indicator_code),
                 SUM(reference_year), printf('%.17g', SUM(value_numeric))
          FROM city_observation_series
        """
        first_fingerprint = connection.execute(fingerprint_sql).fetchone()
        execute_import(connection, import_path)
        second_fingerprint = connection.execute(fingerprint_sql).fetchone()
        if first_fingerprint != second_fingerprint:
            raise RuntimeError(f"{partition} history import is not idempotent")
        if first_fingerprint[0] != expected_rows[partition]:
            raise RuntimeError(
                f"{partition} row count {first_fingerprint[0]} "
                f"does not match {expected_rows[partition]}"
            )
        if first_fingerprint[1:3] != (first_year, last_year):
            raise RuntimeError(f"{partition} year range is incorrect")
        mismatched_statuses = connection.execute(
            "SELECT COUNT(*) FROM city_observation_series "
            "WHERE evidence_status <> ?",
            (status,),
        ).fetchone()[0]
        if mismatched_statuses:
            raise RuntimeError(f"{partition} contains mixed evidence statuses")
        duplicate_groups = connection.execute(
            "SELECT COUNT(*) FROM ("
            "SELECT place_id, indicator_code, reference_year, evidence_status, "
            "COUNT(*) AS copies FROM city_observation_series "
            "GROUP BY place_id, indicator_code, reference_year, evidence_status "
            "HAVING copies > 1)"
        ).fetchone()[0]
        if duplicate_groups:
            raise RuntimeError(f"{partition} contains semantic duplicates")
        if connection.execute("PRAGMA foreign_key_check").fetchone():
            raise RuntimeError(f"{partition} contains foreign-key violations")
        source_releases = connection.execute(
            "SELECT COUNT(*) FROM history_source_releases"
        ).fetchone()[0]
        source_assets = connection.execute(
            "SELECT COUNT(*) FROM history_source_assets"
        ).fetchone()[0]
        if (source_releases, source_assets) != (1, 4):
            raise RuntimeError(f"{partition} provenance metadata is incomplete")
        staging_tables = connection.execute(
            "SELECT COUNT(*) FROM sqlite_master "
            "WHERE type='table' AND name LIKE '%staging%'"
        ).fetchone()[0]
        if staging_tables:
            raise RuntimeError(f"{partition} retained staging tables")
        indexes = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master "
                "WHERE type='index' AND tbl_name='city_observation_series'"
            )
        }
        required_indexes = {
            "idx_city_series_indicator_year",
            "idx_city_series_year_status",
        }
        if not required_indexes.issubset(indexes):
            raise RuntimeError(f"{partition} history indexes are incomplete")
        sample_key = connection.execute(
            "SELECT place_id, indicator_code, reference_year, evidence_status "
            "FROM city_observation_series ORDER BY place_id, indicator_code, "
            "reference_year, evidence_status LIMIT 1"
        ).fetchone()
        for operation in ("UPDATE", "DELETE"):
            try:
                if operation == "UPDATE":
                    connection.execute(
                        "UPDATE city_observation_series "
                        "SET value_numeric=value_numeric "
                        "WHERE place_id=? AND indicator_code=? "
                        "AND reference_year=? AND evidence_status=?",
                        sample_key,
                    )
                else:
                    connection.execute(
                        "DELETE FROM city_observation_series "
                        "WHERE place_id=? AND indicator_code=? "
                        "AND reference_year=? AND evidence_status=?",
                        sample_key,
                    )
            except sqlite3.IntegrityError:
                connection.rollback()
            else:
                raise RuntimeError(f"{partition} append-only {operation} guard failed")
        connection.execute("VACUUM")
        connection.close()
        results[partition] = {
            "rows": first_fingerprint[0],
            "firstYear": first_fingerprint[1],
            "lastYear": first_fingerprint[2],
            "places": first_fingerprint[3],
            "indicators": first_fingerprint[4],
            "evidenceStatus": status,
            "bytes": path.stat().st_size,
            "path": str(path),
            "secondImportUnchanged": True,
            "semanticDuplicateGroups": 0,
            "foreignKeyViolations": 0,
            "sourceReleases": source_releases,
            "sourceAssets": source_assets,
            "stagingTables": 0,
            "appendOnlyGuards": True,
            "indexes": sorted(required_indexes),
        }
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/wup2025"))
    parser.add_argument("--world-bank", type=Path, default=Path("data/raw/world-bank/land-area.zip"))
    parser.add_argument("--m49", type=Path, default=Path("data/raw/world/m49-overview.html"))
    parser.add_argument("--main-output", type=Path, default=Path("database/generated/0005_release_05_main.sql"))
    parser.add_argument(
        "--history-estimates-output",
        type=Path,
        default=Path("database/generated/0006_wup_city_estimates.sql"),
    )
    parser.add_argument(
        "--history-projections-output",
        type=Path,
        default=Path("database/generated/0006_wup_city_projections.sql"),
    )
    parser.add_argument(
        "--history-migration",
        type=Path,
        default=Path("database/history/migrations/0001_city_observation_series.sql"),
    )
    parser.add_argument("--manifest", type=Path, default=Path("data/manifests/release-05-global-data-2026-07-31.json"))
    parser.add_argument("--skip-history-imports", "--skip-series", action="store_true")
    parser.add_argument("--verify-history-dir", "--measure-sqlite-dir", type=Path)
    args = parser.parse_args()
    paths = {key: args.raw_dir / filename for key, filename in WUP_FILES.items()}
    paths["world_bank_land"] = args.world_bank
    for path in paths.values():
        if not path.exists():
            raise SystemExit(f"Missing source asset: {path}")
    hashes = {key: sha256(path) for key, path in paths.items()}
    cities, measures = load_wup(args.raw_dir)
    wb_rows = load_world_bank(args.world_bank)
    main_sql = generate_main(cities, measures, wb_rows, hashes, m49_iso3_codes(args.m49))
    args.main_output.parent.mkdir(parents=True, exist_ok=True)
    args.main_output.write_text(main_sql, encoding="utf-8")
    estimate_values = sum(1 for series in measures.values() for values in series.values() for year in values if year <= 2025)
    projection_values = sum(1 for series in measures.values() for values in series.values() for year in values if year > 2025)
    history_imports = {}
    if not args.skip_history_imports:
        history_imports = {
            "estimates": write_history_import(
                args.history_estimates_output,
                cities,
                measures,
                hashes,
                *HISTORY_PARTITIONS["estimates"],
            ),
            "projections": write_history_import(
                args.history_projections_output,
                cities,
                measures,
                hashes,
                *HISTORY_PARTITIONS["projections"],
            ),
        }
    verified_history = None
    if args.verify_history_dir:
        if not history_imports:
            raise SystemExit(
                "History verification requires generated history imports"
            )
        verified_history = verify_history_databases(
            args.verify_history_dir,
            args.history_migration,
            {
                "estimates": args.history_estimates_output,
                "projections": args.history_projections_output,
            },
            {
                "estimates": estimate_values,
                "projections": projection_values,
            },
        )
    manifest = {
        "generatedAt": RETRIEVED_AT,
        "sources": {key: {"url": WB_URL if key == "world_bank_land" else WUP_BASE + WUP_FILES[key], "sha256": hashes[key]} for key in hashes},
        "coverage": {"cities": len(cities), "estimateValues": estimate_values, "projectionValues": projection_values, "yearRange": [1975, 2050]},
        "storage": {
            "mainSqlBytes": len(main_sql.encode()),
            "historyImports": history_imports or None,
            "sourceUnitRowsDuplicated": 0,
            "verifiedHistoryDatabases": verified_history,
        },
        "notes": ["F29 was unavailable from its published URL at retrieval time.", "Built-up area is deterministically derived from F21 population and F30 built-up area per capita."],
    }
    args.manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

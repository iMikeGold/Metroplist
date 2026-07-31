#!/usr/bin/env python3
"""Acquire official world sources and generate a deterministic D1 import."""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import subprocess

M49_URL = "https://unstats.un.org/unsd/methodology/m49/overview/"
WPP_URL = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz"
WB_URL = "https://api.worldbank.org/v2/country?format=json&per_page=400"
RETRIEVED_AT = "2026-07-31"


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    subprocess.run(
        ["curl", "--fail", "--location", "--silent", "--show-error", "--output", str(temporary), url],
        check=True,
    )
    temporary.replace(destination)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


class M49TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.in_cell = False
        self.cell_parts: list[str] = []
        self.row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "table" and attributes.get("id", "").strip() == "downloadTableEN":
            self.in_table = True
        elif self.in_table and tag == "tr":
            self.row = []
        elif self.in_table and tag in {"td", "th"}:
            self.in_cell = True
            self.cell_parts = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.in_table and tag in {"td", "th"}:
            self.row.append(" ".join("".join(self.cell_parts).split()))
            self.in_cell = False
        elif self.in_table and tag == "tr" and self.row:
            self.rows.append(self.row)
        elif self.in_table and tag == "table":
            self.in_table = False


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "unnamed"


def q(value: object | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def parse_m49(path: Path) -> list[dict[str, str]]:
    parser = M49TableParser()
    parser.feed(path.read_text(encoding="utf-8-sig"))
    headers = parser.rows[0]
    records = [dict(zip(headers, row)) for row in parser.rows[1:] if len(row) == len(headers)]
    required = {"Global Code", "Region Code", "Sub-region Code", "Country or Area", "M49 Code", "ISO-alpha2 Code", "ISO-alpha3 Code"}
    if not required.issubset(headers):
        raise RuntimeError(f"Unexpected M49 columns: {headers}")
    return records


def m49_entities(records: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], list[tuple[str, str]]]:
    entities: dict[str, dict[str, str]] = {"001": {"name": "World", "kind": "special_geographic_entity", "level": "world"}}
    relationships: set[tuple[str, str]] = set()
    for row in records:
        levels = [
            (row.get("Region Code", ""), row.get("Region Name", ""), "region", "major_region"),
            (row.get("Sub-region Code", ""), row.get("Sub-region Name", ""), "region", "subregion"),
            (row.get("Intermediate Region Code", ""), row.get("Intermediate Region Name", ""), "region", "intermediate_region"),
            (row.get("M49 Code", ""), row.get("Country or Area", ""), "country", "country_or_area"),
        ]
        parent = "001"
        for code, name, kind, level in levels:
            if not code:
                continue
            entities.setdefault(code, {"name": name, "kind": kind, "level": level})
            if code != "001" and code != parent:
                relationships.add((code, parent))
            parent = code
        country = row.get("M49 Code", "")
        if country in entities:
            entities[country]["iso2"] = row.get("ISO-alpha2 Code", "")
            entities[country]["iso3"] = row.get("ISO-alpha3 Code", "")
    return entities, sorted(relationships)


def parse_world_bank(path: Path) -> list[dict[str, object]]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    return payload[1]


def parse_wpp(path: Path) -> list[dict[str, str]]:
    with gzip.open(path, "rt", encoding="utf-8-sig", newline="") as source:
        rows = [row for row in csv.DictReader(source) if row["LocTypeName"] == "Country/Area" and row["ISO3_code"] and 1950 <= int(row["Time"]) <= 2023]
    return rows


def generate_sql(m49: list[dict[str, str]], capitals: list[dict[str, object]], wpp: list[dict[str, str]], hashes: dict[str, str]) -> str:
    entities, relationships = m49_entities(m49)
    known_iso3 = {entity.get("iso3") for entity in entities.values() if entity.get("iso3")}
    wpp_only = {
        str(int(row["LocID"])).zfill(3): {
            "name": row["Location"],
            "iso3": row["ISO3_code"],
        }
        for row in wpp
        if row["ISO3_code"] not in known_iso3
    }
    lines = ["PRAGMA foreign_keys = ON;"]
    lines += [
        "INSERT OR IGNORE INTO publishers (id, canonical_name, jurisdiction, publisher_type, website, authority_grade) VALUES ('pub_un_stats', 'United Nations Statistics Division', 'Global', 'intergovernmental_statistical_authority', 'https://unstats.un.org/', 'official'), ('pub_un_population', 'United Nations Population Division', 'Global', 'intergovernmental_statistical_authority', 'https://population.un.org/wpp/', 'official'), ('pub_world_bank', 'World Bank', 'Global', 'intergovernmental_organisation', 'https://www.worldbank.org/', 'official');",
        "INSERT OR IGNORE INTO datasets (id,publisher_id,canonical_title,licence,source_url) VALUES ('ds_un_m49','pub_un_stats','Standard country or area codes for statistical use (M49)',NULL," + q(M49_URL) + "),('ds_wpp_2024','pub_un_population','World Population Prospects 2024: Demographic Indicators Medium','UN data terms'," + q(WPP_URL) + "),('ds_world_bank_countries','pub_world_bank','World Bank Country API','CC BY 4.0'," + q(WB_URL) + ");",
        "INSERT OR IGNORE INTO dataset_releases (id,dataset_id,edition,version,release_date,retrieved_at,content_hash,status) VALUES ('rel_un_m49_2026_07_31','ds_un_m49','current','2026-07-31',NULL," + q(RETRIEVED_AT) + "," + q('sha256:' + hashes['m49']) + ",'validated'),('rel_wpp_2024','ds_wpp_2024','2024','Medium','2024-07-11'," + q(RETRIEVED_AT) + "," + q('sha256:' + hashes['wpp']) + ",'validated'),('rel_world_bank_2026_07_31','ds_world_bank_countries','current','2026-07-31',NULL," + q(RETRIEVED_AT) + "," + q('sha256:' + hashes['world_bank']) + ",'validated');",
    ]
    for key, release, url in [("m49", "rel_un_m49_2026_07_31", M49_URL), ("wpp", "rel_wpp_2024", WPP_URL), ("world_bank", "rel_world_bank_2026_07_31", WB_URL)]:
        lines.append(f"INSERT OR IGNORE INTO source_assets (id,dataset_release_id,source_url,content_hash,retrieved_at,archive_status) VALUES ({q('asset_' + key + '_2026_07_31')},{q(release)},{q(url)},{q('sha256:' + hashes[key])},{q(RETRIEVED_AT)},'external_source');")
    lines.append("INSERT OR IGNORE INTO units (id,code,canonical_name,symbol) VALUES ('unit_thousand_people','thousand_people','Thousand people','thousand people');")
    lines.append("INSERT OR IGNORE INTO indicators (id,code,canonical_name,description,domain,measurement_type,default_unit_id,aggregation_rule,comparison_rule,status) VALUES ('ind_wpp_population_thousands','WPP_POP_TOTAL_THOUSANDS','WPP total population in thousands','Source-unit observation from WPP 2024.','population','count','unit_thousand_people','multiply by 1000 for canonical people unit','same WPP variant and status required','supporting');")
    run_ids = {"m49": "run_un_m49_2026_07_31", "world_bank": "run_world_bank_capitals_2026_07_31", "wpp": "run_wpp_2024_estimates_2026_07_31"}
    for key, dataset in [("m49", "ds_un_m49"), ("world_bank", "ds_world_bank_countries"), ("wpp", "ds_wpp_2024")]:
        lines.append(f"INSERT OR IGNORE INTO ingestion_runs (id,connector_code,dataset_id,started_at,completed_at,status,manifest_json) VALUES ({q(run_ids[key])},{q(key)},{q(dataset)},{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'published','{{}}');")
    for code, entity in sorted(entities.items()):
        pid = f"place_m49_{code}"
        slug = slugify(entity["name"])
        lines.append(f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,status) VALUES ({q(pid)},{q(slug)},{q(entity['name'])},{q(entity['kind'])},'current');")
        lines.append(f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_m49_' + code)},{q(pid)},{q(entity['name'])},'official',1);")
        lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_m49_' + code)},{q(pid)},'UNSD','M49',{q(code)},'rel_un_m49_2026_07_31');")
        for scheme, value in [("ISO_ALPHA2", entity.get("iso2")), ("ISO_ALPHA3", entity.get("iso3"))]:
            if value:
                lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_' + scheme.lower() + '_' + code)},{q(pid)},'ISO',{q(scheme)},{q(value)},'rel_un_m49_2026_07_31');")
        lines.append(f"INSERT OR IGNORE INTO place_classifications (id,place_id,classification_scheme,classification_code,classification_status,source_release_id) VALUES ({q('class_m49_' + code)},{q(pid)},'UN_M49_LEVEL',{q(entity['level'])},{q('unresolved_classification' if entity['level'] == 'country_or_area' else 'statistical_region')},'rel_un_m49_2026_07_31');")
        lines.append(f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,administrative_level,authority,official_code,status) VALUES ({q('geo_m49_' + code)},{q(pid)},{q(entity['level'])},NULL,'UNSD',{q(code)},'current');")
    for child, parent in relationships:
        lines.append(f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_m49_' + child + '_' + parent)},{q('place_m49_' + child)},'within',{q('place_m49_' + parent)},'rel_un_m49_2026_07_31','verified');")
    for code, entity in sorted(wpp_only.items()):
        pid = f"place_wpp_{code}"
        lines.append(f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,status) VALUES ({q(pid)},{q(slugify(entity['name']))},{q(entity['name'])},'country','unresolved');")
        lines.append(f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_wpp_' + code)},{q(pid)},{q(entity['name'])},'source_name',1);")
        lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_wpp_location_' + code)},{q(pid)},'UN Population Division','WPP_LOCATION_CODE',{q(code)},'rel_wpp_2024');")
        lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_wpp_iso3_' + code)},{q(pid)},'UN Population Division','WPP_ISO3',{q(entity['iso3'])},'rel_wpp_2024');")
        lines.append(f"INSERT OR IGNORE INTO place_classifications (id,place_id,classification_scheme,classification_code,classification_status,source_release_id) VALUES ({q('class_wpp_' + code)},{q(pid)},'WPP_LOCATION_TYPE','country_or_area','de_facto_or_disputed_entity','rel_wpp_2024');")
        lines.append(f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,authority,official_code,status) VALUES ({q('geo_wpp_' + code)},{q(pid)},'country_or_area','UN Population Division',{q(code)},'current');")
    iso2_to_code = {entity.get("iso2"): code for code, entity in entities.items() if entity.get("iso2")}
    capital_count = 0
    for country in capitals:
        iso2 = str(country.get("iso2Code") or "")
        capital = str(country.get("capitalCity") or "").strip()
        code = iso2_to_code.get(iso2)
        if not code or not capital:
            continue
        city_id = f"place_capital_{slugify(capital)}_{iso2.lower()}"
        lines.append(f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status,centroid_latitude,centroid_longitude) VALUES ({q(city_id)},{q(slugify(capital) + '-' + iso2.lower())},{q(capital)},'city',{q(iso2)},{q('place_m49_' + code)},'current',{q(country.get('latitude') or None)},{q(country.get('longitude') or None)});")
        lines.append(f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_' + city_id)},{q(city_id)},{q(capital)},'source_name',1);")
        lines.append(f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_capital_' + code)},{q(city_id)},'current_capital_of',{q('place_m49_' + code)},'rel_world_bank_2026_07_31','source_asserted');")
        capital_count += 1
    for row in wpp:
        code = str(int(row["LocID"])).zfill(3)
        year = int(row["Time"])
        raw = float(row["TPopulation1July"])
        raw_id = f"obs_wpp_raw_{code}_{year}"
        output_id = f"obs_wpp_pop_{code}_{year}"
        calc_id = f"calc_wpp_pop_{code}_{year}"
        geo_id = f"geo_wpp_{code}" if code in wpp_only else f"geo_m49_{code}"
        lines.append(f"INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,dataset_release_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES ({q(raw_id)},{q(geo_id)},'ind_wpp_population_thousands','unit_thousand_people','rel_wpp_2024',{raw},{year},{q(str(year)+'-07-01')},{q(str(year)+'-07-01')},'2024-07-11',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',1,'estimate','WPP 2024 medium estimate, source unit');")
        lines.append(f"INSERT OR IGNORE INTO calculations (id,calculation_type,formula_code,formula_version,output_indicator_id,executed_at,input_manifest_json,output_value_numeric,output_unit_id) VALUES ({q(calc_id)},'unit_conversion','THOUSAND_PEOPLE * 1000','1','ind_population_total',{q(RETRIEVED_AT)},{q(json.dumps([raw_id], separators=(',', ':')))}, {raw * 1000.0},'unit_people');")
        lines.append(f"INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,value_numeric,reference_year,reference_period_start,reference_period_end,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES ({q(output_id)},{q(geo_id)},'ind_population_total','unit_people',{raw * 1000.0},{year},{q(str(year)+'-07-01')},{q(str(year)+'-07-01')},'2024-07-11',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',1,'estimate','Metroplist WPP unit conversion v1');")
        lines.append(f"INSERT OR IGNORE INTO calculation_inputs (id,calculation_id,observation_id,input_role) VALUES ({q('ci_' + calc_id)},{q(calc_id)},{q(raw_id)},'source_value');")
        lines.append(f"INSERT OR IGNORE INTO observation_lineage (id,output_observation_id,input_observation_id,calculation_id,input_role) VALUES ({q('lin_' + calc_id)},{q(output_id)},{q(raw_id)},{q(calc_id)},'source_value');")
    lines.append(f"-- m49_entities={len(entities)} m49_countries_or_areas={sum(1 for e in entities.values() if e['level']=='country_or_area')} wpp_only_entities={len(wpp_only)} capitals={capital_count} wpp_rows={len(wpp)}")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/world"))
    parser.add_argument("--output", type=Path, default=Path("database/generated/0003_world_registry.sql"))
    parser.add_argument("--manifest", type=Path, default=Path("data/manifests/world-registry-2026-07-31.json"))
    parser.add_argument("--acquire", action="store_true")
    args = parser.parse_args()
    paths = {"m49": args.raw_dir / "m49-overview.html", "wpp": args.raw_dir / "WPP2024_Demographic_Indicators_Medium.csv.gz", "world_bank": args.raw_dir / "world-bank-countries.json"}
    if args.acquire:
        for key, url in [("m49", M49_URL), ("wpp", WPP_URL), ("world_bank", WB_URL)]:
            download(url, paths[key])
    for path in paths.values():
        if not path.exists():
            raise SystemExit(f"Missing source asset: {path}. Run with --acquire.")
    hashes = {key: sha256(path) for key, path in paths.items()}
    m49 = parse_m49(paths["m49"])
    capitals = parse_world_bank(paths["world_bank"])
    wpp = parse_wpp(paths["wpp"])
    sql = generate_sql(m49, capitals, wpp, hashes)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(sql, encoding="utf-8")
    entities, _ = m49_entities(m49)
    wpp_location_count = len({row["LocID"] for row in wpp})
    wpp_only_count = len(
        {
            row["LocID"]
            for row in wpp
            if row["ISO3_code"] not in {entity.get("iso3") for entity in entities.values()}
        }
    )
    manifest = {
        "generatedAt": RETRIEVED_AT,
        "sources": {key: {"url": url, "sha256": hashes[key]} for key, url in [("m49", M49_URL), ("wpp", WPP_URL), ("world_bank", WB_URL)]},
        "counts": {
            "m49Rows": len(m49),
            "m49Places": len(entities),
            "m49CountriesOrAreas": sum(
                1 for entity in entities.values() if entity["level"] == "country_or_area"
            ),
            "wppLocations": wpp_location_count,
            "wppOnlyLocations": wpp_only_count,
            "worldBankRecords": len(capitals),
            "wppEstimateRows": len(wpp),
        },
        "wppYearRange": [min(int(row["Time"]) for row in wpp), max(int(row["Time"]) for row in wpp)],
        "generatedSqlSha256": hashlib.sha256(sql.encode()).hexdigest(),
        "rawAssetsCommitted": False,
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

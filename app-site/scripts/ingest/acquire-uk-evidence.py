#!/usr/bin/env python3
"""Acquire and generate Census 2021 population evidence for LTLAs and wards."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from urllib.parse import urlencode

RETRIEVED_AT = "2026-07-31"
TS001_BASE = "https://api.beta.ons.gov.uk/v1/datasets/TS001/editions/2021/versions/3/json"
WARD_URL = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/WD22_LAD22_UK_LU/FeatureServer/0/query"


def q(value: object | None) -> str:
    return "NULL" if value is None else "'" + str(value).replace("'", "''") + "'"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error", url, "-o", str(destination)], check=True)


def acquire_wards(destination: Path) -> None:
    features = []
    offset = 0
    while True:
        query = urlencode({
            "where": "1=1", "outFields": "WD22CD,WD22NM,WD22NMW,LAD22CD,LAD22NM",
            "returnGeometry": "false", "resultOffset": offset,
            "resultRecordCount": 2000, "orderByFields": "WD22CD", "f": "json",
        })
        response = subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error", f"{WARD_URL}?{query}"], check=True, capture_output=True)
        page = json.loads(response.stdout)
        if page.get("error"):
            raise RuntimeError(f"ONS ward query failed: {page['error']}")
        batch = page.get("features", [])
        if offset == 0 and not batch:
            raise RuntimeError("ONS ward query returned no features")
        features.extend(batch)
        if not page.get("exceededTransferLimit"):
            break
        offset += len(batch)
    destination.write_text(json.dumps({"source": WARD_URL, "features": features}, sort_keys=True, separators=(",", ":")) + "\n")


def ts001_rows(path: Path) -> list[dict[str, object]]:
    payload = json.loads(path.read_text())
    areas = payload["dimensions"][0]["options"]
    observations = payload["observations"]
    if len(observations) != len(areas) * 2:
        raise RuntimeError("TS001 did not return exactly two residence values per area")
    return [
        {"code": area["id"], "name": area["label"], "household": observations[index * 2], "communal": observations[index * 2 + 1]}
        for index, area in enumerate(areas)
    ]


def emit_population(lines: list[str], code: str, geography_id: str, household: int, communal: int) -> None:
    total = household + communal
    base = code.lower()
    household_id = f"obs_ts001_{base}_household_2021"
    communal_id = f"obs_ts001_{base}_communal_2021"
    total_id = f"obs_ts001_{base}_total_2021"
    calculation_id = f"calc_ts001_{base}_total_2021"
    for observation_id, indicator_id, value, method in [
        (household_id, "ind_household_residents", household, "TS001-v3 category 1: Lives in a household"),
        (communal_id, "ind_communal_establishment_residents", communal, "TS001-v3 category 2: Lives in a communal establishment"),
    ]:
        lines.append(
            "INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,dataset_release_id,value_numeric,reference_period_start,reference_period_end,reference_year,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES "
            f"({q(observation_id)},{q(geography_id)},{q(indicator_id)},'unit_people','rel_ons_ts001_2021_v3',{value},'2021-03-21','2021-03-21',2021,'2023-02-16',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',0,'reported',{q(method)});"
        )
    lines.append(f"INSERT OR IGNORE INTO calculations (id,calculation_type,formula_code,formula_version,output_indicator_id,executed_at,input_manifest_json,output_value_numeric,output_unit_id) VALUES ({q(calculation_id)},'derived_observation','POP_HOUSEHOLD_RESIDENTS + POP_COMMUNAL_ESTABLISHMENT_RESIDENTS','1','ind_population_total',{q(RETRIEVED_AT)},{q(json.dumps([household_id, communal_id], separators=(',', ':')))},{total},'unit_people');")
    lines.append(f"INSERT OR IGNORE INTO observations (id,geography_id,indicator_id,unit_id,value_numeric,reference_period_start,reference_period_end,reference_year,publication_date,ingested_at,verified_at,quality_status,preferred_status,is_estimate,evidence_status,methodology_version) VALUES ({q(total_id)},{q(geography_id)},'ind_population_total','unit_people',{total},'2021-03-21','2021-03-21',2021,'2023-02-16',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'verified','preferred',0,'reported','Metroplist TS001 population aggregation v1');")
    for role, source_id in [("household_residents", household_id), ("communal_establishment_residents", communal_id)]:
        lines.append(f"INSERT OR IGNORE INTO calculation_inputs (id,calculation_id,observation_id,input_role) VALUES ({q('ci_' + calculation_id + '_' + role)},{q(calculation_id)},{q(source_id)},{q(role)});")
        lines.append(f"INSERT OR IGNORE INTO observation_lineage (id,output_observation_id,input_observation_id,calculation_id,input_role) VALUES ({q('lin_' + calculation_id + '_' + role)},{q(total_id)},{q(source_id)},{q(calculation_id)},{q(role)});")


def generate(ltlas, wards, ward_features, hashes) -> str:
    lines = ["PRAGMA foreign_keys = ON;"]
    lines.append(f"INSERT OR IGNORE INTO source_assets (id,dataset_release_id,source_url,content_hash,retrieved_at,archive_status) VALUES ('asset_ts001_ltla_r05','rel_ons_ts001_2021_v3',{q(TS001_BASE)},{q('sha256:' + hashes['ltla'])},{q(RETRIEVED_AT)},'external_source'),('asset_ts001_ward_r05','rel_ons_ts001_2021_v3',{q(TS001_BASE + '?area-type=wd')},{q('sha256:' + hashes['ward'])},{q(RETRIEVED_AT)},'external_source');")
    lines.append(f"INSERT OR IGNORE INTO ingestion_runs (id,connector_code,dataset_id,started_at,completed_at,status,manifest_json) VALUES ('run_ons_ts001_bulk_r05','ons_census_api','ds_ons_ts001_2021',{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'published','{{\"areaTypes\":[\"ltla\",\"wd\"]}}');")
    release_01 = {"E09000011", "E09000006"}
    for row in ltlas:
        if row["code"] in release_01:
            continue
        emit_population(lines, str(row["code"]), f"geo_ons_{str(row['code']).lower()}", int(row["household"]), int(row["communal"]))
    centroids = {f["attributes"]["WD22CD"]: f["attributes"] for f in ward_features}
    parents = {f["attributes"]["WD22CD"]: f["attributes"]["LAD22CD"] for f in ward_features}
    existing_parent = {"E09000011": "place_greenwich_royal_borough", "E09000006": "place_bromley_london_borough"}
    for row in wards:
        code = str(row["code"])
        parent_code = parents.get(code)
        if not parent_code:
            continue
        parent_id = existing_parent.get(parent_code, f"place_ons_{parent_code.lower()}")
        place_id, geography_id = f"place_ons_{code.lower()}", f"geo_ons_{code.lower()}"
        point = centroids.get(code, {})
        lines.append(f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status,centroid_latitude,centroid_longitude) VALUES ({q(place_id)},{q(row['name'].lower().replace(' ', '-') + '-' + code.lower())},{q(row['name'])},'ward','GB',{q(parent_id)},'current',{q(point.get('LAT'))},{q(point.get('LONG'))});")
        lines.append(f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_ons_' + code.lower())},{q(place_id)},{q(row['name'])},'official',1);")
        lines.append(f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_ons_' + code.lower())},{q(place_id)},'ONS','GSS',{q(code)},'rel_ons_ts001_2021_v3');")
        lines.append(f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,administrative_level,authority,official_code,valid_from,status) VALUES ({q(geography_id)},{q(place_id)},'electoral_ward','ward','ONS',{q(code)},'2021-12-31','current');")
        lines.append(f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_ons_ward_parent_' + code.lower())},{q(place_id)},'within',{q(parent_id)},'rel_ons_ts001_2021_v3','verified');")
        emit_population(lines, code, geography_id, int(row["household"]), int(row["communal"]))
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--acquire", action="store_true")
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/uk"))
    parser.add_argument("--output", type=Path, default=Path("database/generated/0007_uk_population_evidence.sql"))
    parser.add_argument("--manifest", type=Path, default=Path("data/manifests/release-05-uk-evidence-2026-07-31.json"))
    args = parser.parse_args()
    paths = {"ltla": args.raw_dir / "ts001-ltla.json", "ward": args.raw_dir / "ts001-ward.json", "ward_features": args.raw_dir / "wards-2022.json"}
    if args.acquire:
        download(TS001_BASE, paths["ltla"])
        download(TS001_BASE + "?area-type=wd", paths["ward"])
        acquire_wards(paths["ward_features"])
    for path in paths.values():
        if not path.exists(): raise SystemExit(f"Missing source asset: {path}. Run with --acquire.")
    hashes = {key: sha256(path) for key, path in paths.items()}
    ltlas, wards = ts001_rows(paths["ltla"]), ts001_rows(paths["ward"])
    ward_features = json.loads(paths["ward_features"].read_text())["features"]
    sql = generate(ltlas, wards, ward_features, hashes)
    args.output.write_text(sql)
    ward_codes = {feature["attributes"]["WD22CD"] for feature in ward_features}
    resolved_wards = sum(1 for ward in wards if ward["code"] in ward_codes)
    unresolved = [{"code": ward["code"], "name": ward["name"]} for ward in wards if ward["code"] not in ward_codes]
    manifest = {"generatedAt": RETRIEVED_AT, "counts": {"localAuthorities": len(ltlas), "wardsReturnedByTs001": len(wards), "wardsResolvedToDecember2022Geography": resolved_wards, "populationObservationsGenerated": (len(ltlas) - 2 + resolved_wards) * 3}, "unresolvedWardRows": unresolved, "sources": {key: {"sha256": value} for key, value in hashes.items()}, "generatedSqlSha256": hashlib.sha256(sql.encode()).hexdigest()}
    args.manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

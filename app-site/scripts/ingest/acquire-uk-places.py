#!/usr/bin/env python3
"""Acquire ONS UK geography registers and generate deterministic D1 SQL."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlencode

RETRIEVED_AT = "2026-07-31"
LAD_URL = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_December_2021_UK_BUC_2022/FeatureServer/0/query"
BUA_URL = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/BUA_DEC_2022_EW_NC/FeatureServer/0/query"


def q(value: object | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch_page(url: str, fields: list[str], offset: int, count: int) -> dict[str, object]:
    parameters = urlencode(
        {
            "where": "1=1",
            "outFields": ",".join(fields),
            "returnGeometry": "false",
            "resultOffset": offset,
            "resultRecordCount": count,
            "orderByFields": fields[0],
            "f": "json",
        }
    )
    result = subprocess.run(
        ["curl", "--fail", "--location", "--silent", "--show-error", f"{url}?{parameters}"],
        check=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


def acquire(url: str, fields: list[str], destination: Path, page_size: int) -> None:
    features: list[dict[str, object]] = []
    offset = 0
    while True:
        page = fetch_page(url, fields, offset, page_size)
        batch = page.get("features", [])
        if not isinstance(batch, list):
            raise RuntimeError(f"Unexpected ArcGIS response: {page}")
        features.extend(batch)
        if not page.get("exceededTransferLimit"):
            break
        offset += len(batch)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps({"source": url, "features": features}, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def attributes(path: Path) -> list[dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return [feature["attributes"] for feature in payload["features"]]


def generate_sql(lads: list[dict[str, str]], buas: list[dict[str, str]], hashes: dict[str, str]) -> str:
    lines = ["PRAGMA foreign_keys = ON;"]
    lines.append(
        "INSERT OR IGNORE INTO datasets (id,publisher_id,canonical_title,licence,source_url) VALUES "
        "('ds_ons_lad_2021','pub_ons','Local Authority Districts (December 2021) Names and Codes in the UK','Open Government Licence v3.0',"
        + q(LAD_URL)
        + "),('ds_ons_bua_2022','pub_ons','Built-up Areas (December 2022) Names and Codes in England and Wales','Open Government Licence v3.0',"
        + q(BUA_URL)
        + ");"
    )
    lines.append(
        "INSERT OR IGNORE INTO dataset_releases (id,dataset_id,edition,version,release_date,retrieved_at,content_hash,status) VALUES "
        f"('rel_ons_lad_2021','ds_ons_lad_2021','December 2021','ArcGIS snapshot',NULL,{q(RETRIEVED_AT)},{q('sha256:' + hashes['lad'])},'validated'),"
        f"('rel_ons_bua_2022','ds_ons_bua_2022','December 2022','ArcGIS snapshot',NULL,{q(RETRIEVED_AT)},{q('sha256:' + hashes['bua'])},'validated');"
    )
    for key, release, url in [
        ("lad", "rel_ons_lad_2021", LAD_URL),
        ("bua", "rel_ons_bua_2022", BUA_URL),
    ]:
        lines.append(
            "INSERT OR IGNORE INTO source_assets "
            "(id,dataset_release_id,source_url,content_hash,retrieved_at,archive_status) VALUES "
            f"({q('asset_ons_' + key + '_2026_07_31')},{q(release)},{q(url)},{q('sha256:' + hashes[key])},{q(RETRIEVED_AT)},'external_source');"
        )
        lines.append(
            "INSERT OR IGNORE INTO ingestion_runs "
            "(id,connector_code,dataset_id,started_at,completed_at,status,manifest_json) VALUES "
            f"({q('run_ons_' + key + '_2026_07_31')},'ons_open_geography',{q('ds_ons_' + key + ('_2021' if key == 'lad' else '_2022'))},{q(RETRIEVED_AT)},{q(RETRIEVED_AT)},'published','{{}}');"
        )
    countries = [
        ("K02000001", "United Kingdom", "place_m49_826", None),
        ("E92000001", "England", "place_england", "place_m49_826"),
        ("W92000004", "Wales", "place_ons_w92000004", "place_m49_826"),
        ("S92000003", "Scotland", "place_ons_s92000003", "place_m49_826"),
        ("N92000002", "Northern Ireland", "place_ons_n92000002", "place_m49_826"),
    ]
    for code, name, place_id, parent in countries:
        if place_id not in {"place_m49_826", "place_england"}:
            lines.append(
                f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status) VALUES ({q(place_id)},{q(slugify(name))},{q(name)},'country','GB',{q(parent)},'current');"
            )
            lines.append(
                f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_' + place_id)},{q(place_id)},{q(name)},'official',1);"
            )
        lines.append(
            f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_ons_' + code.lower())},{q(place_id)},'ONS','GSS',{q(code)},'rel_ons_lad_2021');"
        )
        if parent:
            lines.append(
                f"INSERT OR IGNORE INTO place_relationships (id,subject_place_id,relationship_type,object_place_id,source_release_id,confidence) VALUES ({q('rel_ons_within_' + code.lower())},{q(place_id)},'within',{q(parent)},'rel_ons_lad_2021','verified');"
            )
    nation_parent = {
        "E": "place_england",
        "W": "place_ons_w92000004",
        "S": "place_ons_s92000003",
        "N": "place_ons_n92000002",
        "K": "place_m49_826",
    }
    existing = {
        "E09000011": "place_greenwich_royal_borough",
        "E09000006": "place_bromley_london_borough",
    }
    for row in sorted(lads, key=lambda item: item["LAD21CD"]):
        code, name = row["LAD21CD"], row["LAD21NM"]
        if code in existing:
            continue
        place_id = existing.get(code, f"place_ons_{code.lower()}")
        lines.append(
            f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status) VALUES ({q(place_id)},{q(slugify(name) + '-' + code.lower())},{q(name)},'district','GB',{q(nation_parent[code[0]])},'current');"
        )
        lines.append(
            f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_ons_' + code.lower())},{q(place_id)},{q(name)},'official',1);"
        )
        search_alias = (
            name.removeprefix("City of ").removesuffix(" City").strip()
            if name.startswith("City of ") or name.endswith(" City")
            else None
        )
        if search_alias and search_alias != name:
            lines.append(
                f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_ons_' + code.lower() + '_search')},{q(place_id)},{q(search_alias)},'normalized_search_alias',0);"
            )
        lines.append(
            f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_ons_' + code.lower())},{q(place_id)},'ONS','GSS',{q(code)},'rel_ons_lad_2021');"
        )
        geo_id = f"geo_ons_{code.lower()}"
        lines.append(
            f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,administrative_level,authority,official_code,valid_from,status) VALUES ({q(geo_id)},{q(place_id)},'lower_tier_local_authority','local_authority_district','ONS',{q(code)},'2021-12-31','current');"
        )
        lines.append(
            f"INSERT OR IGNORE INTO boundary_versions (id,geography_id,reference_date,reference_year,source_release_id,simplification_level,licence,imported_at) VALUES ({q('boundary_ons_' + code.lower() + '_2021')},{q(geo_id)},'2021-12-31',2021,'rel_ons_lad_2021','names_and_codes_only','Open Government Licence v3.0',{q(RETRIEVED_AT)});"
        )
    for row in sorted(buas, key=lambda item: item["BUA22CD"]):
        code, name = row["BUA22CD"], row["BUA22NM"]
        parent = nation_parent[code[0]]
        place_id = f"place_ons_{code.lower()}"
        lines.append(
            f"INSERT OR IGNORE INTO places (id,slug,canonical_name,place_kind,country_code,parent_place_id,status) VALUES ({q(place_id)},{q(slugify(name) + '-' + code.lower())},{q(name)},'statistical_area','GB',{q(parent)},'current');"
        )
        lines.append(
            f"INSERT OR IGNORE INTO place_names (id,place_id,name,name_type,is_primary) VALUES ({q('name_ons_' + code.lower())},{q(place_id)},{q(name)},'official',1);"
        )
        welsh = row.get("BUA22NMW")
        if welsh and welsh != name:
            lines.append(
                f"INSERT OR IGNORE INTO place_names (id,place_id,name,language_code,name_type,is_primary) VALUES ({q('name_ons_' + code.lower() + '_cy')},{q(place_id)},{q(welsh)},'cy','official',0);"
            )
        lines.append(
            f"INSERT OR IGNORE INTO place_identifiers (id,place_id,authority,scheme,identifier,source_release_id) VALUES ({q('pid_ons_' + code.lower())},{q(place_id)},'ONS','GSS',{q(code)},'rel_ons_bua_2022');"
        )
        lines.append(
            f"INSERT OR IGNORE INTO geographies (id,place_id,geography_type,authority,official_code,valid_from,status) VALUES ({q('geo_ons_' + code.lower())},{q(place_id)},'built_up_area_2021','ONS',{q(code)},'2022-12-01','current');"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--acquire", action="store_true")
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/uk"))
    parser.add_argument("--output", type=Path, default=Path("database/generated/0004_uk_places.sql"))
    parser.add_argument("--manifest", type=Path, default=Path("data/manifests/uk-places-2026-07-31.json"))
    args = parser.parse_args()
    lad_path, bua_path = args.raw_dir / "lad-2021.json", args.raw_dir / "bua-2022.json"
    if args.acquire:
        acquire(LAD_URL, ["LAD21CD", "LAD21NM", "LAD21NMW"], lad_path, 2000)
        acquire(BUA_URL, ["BUA22CD", "BUA22NM", "BUA22NMW"], bua_path, 1000)
    if not lad_path.exists() or not bua_path.exists():
        raise SystemExit("Missing UK source assets. Run with --acquire.")
    lads, buas = attributes(lad_path), attributes(bua_path)
    hashes = {"lad": sha256(lad_path), "bua": sha256(bua_path)}
    sql = generate_sql(lads, buas, hashes)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(sql, encoding="utf-8")
    manifest = {
        "generatedAt": RETRIEVED_AT,
        "counts": {"localAuthorityDistricts": len(lads), "builtUpAreas": len(buas)},
        "sources": {
            "localAuthorityDistricts": {"url": LAD_URL, "sha256": hashes["lad"], "referenceDate": "2021-12-31"},
            "builtUpAreas": {"url": BUA_URL, "sha256": hashes["bua"], "referenceDate": "2022-12-01", "censusBasis": "2021"},
        },
        "generatedSqlSha256": hashlib.sha256(sql.encode()).hexdigest(),
        "rawAssetsCommitted": False,
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate a mongosh import script from Release Tracker Excel.

This script does not insert data itself. It creates:
1) A mongosh JS file with upsert operations for releases and activities.
2) A JSON report showing extracted row counts and skipped rows.

Usage:
  python3 scripts/generate_mongo_import_from_excel.py \
    --excel "/path/to/Release Tracker 2026 - 07 May 2026.xlsx" \
    --out-js scripts/generated/import_release_tracker.mongosh.js \
    --out-report scripts/generated/import_release_tracker.report.json
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Tuple
import xml.etree.ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

RELEASE_SHEETS = ["Release 2026", "Release 2025", "2024", "2022-23"]
ACTIVITY_SHEETS = ["Activity Log", "Activity 2025"]
SECURITY_SHEET = "Security Fixes"


def col_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    num = 0
    for ch in letters:
        num = num * 26 + (ord(ch.upper()) - 64)
    return num


def parse_excel_value(cell: ET.Element, shared: List[str]) -> Any:
    t = cell.attrib.get("t")
    v_el = cell.find("main:v", NS)

    if v_el is None:
        is_el = cell.find("main:is/main:t", NS)
        if is_el is None:
            return ""
        return is_el.text or ""

    raw = (v_el.text or "").strip()
    if t == "s":
        if raw.isdigit():
            idx = int(raw)
            if 0 <= idx < len(shared):
                return shared[idx]
        return raw

    if t == "b":
        return raw == "1"

    # Numeric-like values in release tracker are mostly serials and counters.
    if re.fullmatch(r"-?\d+", raw):
        try:
            return int(raw)
        except ValueError:
            return raw

    if re.fullmatch(r"-?\d*\.\d+(E-?\d+)?", raw, flags=re.IGNORECASE) or re.fullmatch(
        r"-?\d+E-?\d+", raw, flags=re.IGNORECASE
    ):
        try:
            return float(raw)
        except ValueError:
            return raw

    return raw


def load_workbook_rows(excel_path: Path) -> Dict[str, List[Dict[int, Any]]]:
    with zipfile.ZipFile(excel_path) as zf:
        wb = ET.fromstring(zf.read("xl/workbook.xml"))
        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_map = {
            r.attrib["Id"]: r.attrib["Target"]
            for r in rels.findall("pkgrel:Relationship", NS)
        }

        shared: List[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            sst = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in sst.findall("main:si", NS):
                texts = [t.text or "" for t in si.findall(".//main:t", NS)]
                shared.append("".join(texts))

        sheets: List[Tuple[str, str]] = []
        for sheet in wb.findall("main:sheets/main:sheet", NS):
            name = sheet.attrib.get("name", "")
            rid = sheet.attrib.get("{%s}id" % NS["rel"], "")
            target = rel_map.get(rid, "")
            if not target.startswith("xl/"):
                target = "xl/" + target
            sheets.append((name, target))

        all_rows: Dict[str, List[Dict[int, Any]]] = {}
        for name, target in sheets:
            xml = ET.fromstring(zf.read(target))
            out: List[Dict[int, Any]] = []
            for row in xml.findall("main:sheetData/main:row", NS):
                row_num = int(row.attrib.get("r", "0"))
                row_map: Dict[int, Any] = {0: row_num}
                non_empty = 0
                for c in row.findall("main:c", NS):
                    idx = col_index(c.attrib.get("r", "A1"))
                    val = parse_excel_value(c, shared)
                    if isinstance(val, str):
                        val = val.strip()
                    if val not in (None, ""):
                        row_map[idx] = val
                        non_empty += 1
                if non_empty > 0:
                    out.append(row_map)
            all_rows[name] = out

        return all_rows


def clean_text(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def normalize_placeholder(v: Any) -> Any:
    s = clean_text(v)
    if s in ("", "???", "N/A", "n/a", "NA"):
        return None
    return v


def parse_release_row(sheet: str, r: Dict[int, Any]) -> Dict[str, Any] | None:
    # Sheet-specific column layout
    if sheet in ("Release 2026", "Release 2025"):
        release_package = clean_text(r.get(3))
        if not release_package:
            return None
        if release_package.lower().startswith("release/package"):
            return None
        return {
            "sourceSheet": sheet,
            "sourceRow": r.get(0),
            "releasePackage": release_package,
            "statusRaw": normalize_placeholder(r.get(4)),
            "typeRaw": normalize_placeholder(r.get(5)),
            "receivedRaw": normalize_placeholder(r.get(6)),
            "stagingRaw": normalize_placeholder(r.get(7)),
            "liveRaw": normalize_placeholder(r.get(8)),
            "downloadLink": normalize_placeholder(r.get(9)),
            "downloadPassword": normalize_placeholder(r.get(10)),
            # 2026: c11 components, c12 db scripts, c13 comments
            # 2025: c11 apk, c12 db query, c13 components, c14 comments
            "components": normalize_placeholder(r.get(13) if sheet == "Release 2025" else r.get(11)),
            "dbScripts": normalize_placeholder(r.get(12)),
            "comments": normalize_placeholder(r.get(14) if sheet == "Release 2025" else r.get(13)),
        }

    if sheet in ("2024", "2022-23"):
        release_package = clean_text(r.get(2))
        if not release_package:
            return None
        if release_package.lower().startswith("release/package"):
            return None
        return {
            "sourceSheet": sheet,
            "sourceRow": r.get(0),
            "releasePackage": release_package,
            # Older sheets do not carry explicit status/type in dedicated columns.
            "statusRaw": None,
            "typeRaw": None,
            "receivedRaw": normalize_placeholder(r.get(3)),
            "stagingRaw": normalize_placeholder(r.get(4)),
            "liveRaw": normalize_placeholder(r.get(5)),
            "downloadLink": normalize_placeholder(r.get(6)),
            "downloadPassword": normalize_placeholder(r.get(7)),
            "components": normalize_placeholder(r.get(11)),
            "dbScripts": normalize_placeholder(r.get(10)),
            "comments": normalize_placeholder(r.get(9)),
        }

    return None


def parse_activity_row(sheet: str, r: Dict[int, Any]) -> Dict[str, Any] | None:
    title = clean_text(r.get(3))
    if not title:
        return None
    if title.lower() in ("title", "total activity", "total activity hour"):
        return None
    return {
        "sourceSheet": sheet,
        "sourceRow": r.get(0),
        "title": title,
        "fixRaw": normalize_placeholder(r.get(4)),
        "platformRaw": normalize_placeholder(r.get(5)),
        "dateRaw": normalize_placeholder(r.get(6)),
        "startRaw": normalize_placeholder(r.get(7)),
        "endRaw": normalize_placeholder(r.get(8)),
        "durationRaw": normalize_placeholder(r.get(9)),
        "comments": normalize_placeholder(r.get(10)),
    }


def parse_security_row(r: Dict[int, Any]) -> Dict[str, Any] | None:
    ref_no = clean_text(r.get(4))
    issue_title = clean_text(r.get(5))
    if not issue_title and not ref_no:
        return None
    if issue_title.lower() == "issue title":
        return None

    title = f"{ref_no} - {issue_title}".strip(" -")
    return {
        "sourceSheet": SECURITY_SHEET,
        "sourceRow": r.get(0),
        "title": title,
        "fixRaw": "Security",
        "platformRaw": "Live",
        "statusRaw": normalize_placeholder(r.get(6)),
        "api": normalize_placeholder(r.get(7)),
        "dateRaw": normalize_placeholder(r.get(8)),
        "deployedRaw": normalize_placeholder(r.get(9)),
        "comments": normalize_placeholder(r.get(11)),
    }


def to_js(value: Any) -> str:
    # Safe JSON literal for JS embedding
    return json.dumps(value, ensure_ascii=True)


def generate_mongosh_script(release_rows: List[Dict[str, Any]], activity_rows: List[Dict[str, Any]], security_rows: List[Dict[str, Any]]) -> str:
    return f"""// Auto-generated by scripts/generate_mongo_import_from_excel.py\n// Run with: mongosh \"<ATLAS_URI>\" scripts/generated/import_release_tracker.mongosh.js\n\nuse spd;\n\nconst RELEASE_ROWS = {to_js(release_rows)};\nconst ACTIVITY_ROWS = {to_js(activity_rows)};\nconst SECURITY_ROWS = {to_js(security_rows)};\n\nfunction cleanText(v) {{\n  if (v === null || v === undefined) return \"\";\n  return String(v).trim();\n}}\n\nfunction normalizeRaw(v) {{\n  const s = cleanText(v);\n  if (!s || s === \"???\" || s.toLowerCase() === \"n/a\" || s.toLowerCase() === \"na\") return null;\n  return v;\n}}\n\nfunction excelSerialToDate(serial) {{\n  const v = normalizeRaw(serial);\n  if (v === null) return null;\n  const n = Number(v);\n  if (Number.isNaN(n)) return null;\n  const ms = Math.round((n - 25569) * 86400 * 1000);\n  return new Date(ms);\n}}\n\nfunction excelTimeFractionToHHMM(fraction) {{\n  const v = normalizeRaw(fraction);\n  if (v === null) return null;\n  const n = Number(v);\n  if (Number.isNaN(n)) return String(v);\n  const totalMinutes = Math.round(n * 24 * 60);\n  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, \"0\");\n  const mm = String(totalMinutes % 60).padStart(2, \"0\");\n  return `${{hh}}:${{mm}}`;\n}}\n\nfunction mapReleaseStatus(v) {{\n  const s = cleanText(v).toLowerCase();\n  if (s.includes(\"prod\") || s.includes(\"live\")) return \"production\";\n  if (s.includes(\"stag\")) return \"staging\";\n  if (s.includes(\"over\")) return \"overwritten\";\n  if (s.includes(\"halt\")) return \"halted\";\n  if (s.includes(\"dc2\")) return \"dc2\";\n  return \"staging\";\n}}\n\nfunction mapReleaseType(v) {{\n  const s = cleanText(v).toLowerCase();\n  if (s.includes(\"financial\")) return \"financial-glitch-hotfix\";\n  if (s.includes(\"new feature\") || s.includes(\"changes\")) return \"new-feature-changes\";\n  if (s.includes(\"security\")) return \"security-fix\";\n  if (s.includes(\"system enhancement\")) return \"system-enhancement\";\n  if (s.includes(\"mobile\")) return \"mobile-app-glitch\";\n  if (s.includes(\"application glitch\")) return \"application-glitch\";\n  return \"application-glitch\";\n}}\n\nfunction mapActivityType(v) {{\n  const s = cleanText(v).toLowerCase();\n  if (s.includes(\"release\")) return \"release\";\n  if (s.includes(\"maintenance\")) return \"maintenance\";\n  if (s.includes(\"security\")) return \"security\";\n  if (s.includes(\"fix\")) return \"hotfix\";\n  return \"maintenance\";\n}}\n\nfunction mapActivityEnvironment(v) {{\n  const s = cleanText(v).toLowerCase();\n  if (s.includes(\"live\") || s.includes(\"prod\")) return \"production\";\n  return \"staging\";\n}}\n\nfunction mapActivityStatus(v) {{\n  const s = cleanText(v).toLowerCase();\n  if (s === \"closed\" || s === \"completed\" || s === \"done\") return \"completed\";\n  if (s === \"open\" || s === \"planned\") return \"planned\";\n  if (s.includes(\"progress\")) return \"in-progress\";\n  if (s.includes(\"reject\")) return \"rejected\";\n  if (s.includes(\"reopen\")) return \"reopened\";\n  return \"planned\";\n}}\n\nconst projectName = \"Nagad Release Tracker\";\nlet project = db.projects.findOne({{ name: projectName }});\nif (!project) {{\n  const res = db.projects.insertOne({{\n    name: projectName,\n    description: \"Imported from Release Tracker Excel\",\n    createdBy: \"excel-import\",\n    createdAt: new Date(),\n    updatedAt: new Date(),\n  }});\n  project = db.projects.findOne({{ _id: res.insertedId }});\n}}\n\nlet releaseUpserts = 0;\nfor (const r of RELEASE_ROWS) {{\n  const releasePackage = cleanText(r.releasePackage);\n  if (!releasePackage) continue;\n\n  const doc = {{\n    projectId: project._id,\n    releasePackage,\n    status: mapReleaseStatus(r.statusRaw),\n    type: mapReleaseType(r.typeRaw),\n    received: excelSerialToDate(r.receivedRaw),\n    staging: excelSerialToDate(r.stagingRaw),\n    live: excelSerialToDate(r.liveRaw),\n    downloadLink: normalizeRaw(r.downloadLink),\n    downloadPassword: normalizeRaw(r.downloadPassword),\n    components: normalizeRaw(r.components),\n    dbScripts: normalizeRaw(r.dbScripts),\n    comments: normalizeRaw(r.comments),\n    pipelineStage: \"standalone\",\n    isDeleted: false,\n    updatedAt: new Date(),\n  }};\n\n  db.releases.updateOne(\n    {{ projectId: project._id, releasePackage }},\n    {{ $set: doc, $setOnInsert: {{ createdAt: new Date() }} }},\n    {{ upsert: true }}\n  );\n  releaseUpserts += 1;\n}}\n\nlet activityUpserts = 0;\nfor (const a of ACTIVITY_ROWS) {{\n  const title = cleanText(a.title);\n  const date = excelSerialToDate(a.dateRaw);\n  if (!title || !date) continue;\n\n  const doc = {{\n    projectId: project._id,\n    scope: \"project\",\n    title,\n    date,\n    type: mapActivityType(a.fixRaw),\n    environment: mapActivityEnvironment(a.platformRaw),\n    status: \"planned\",\n    startTime: excelTimeFractionToHHMM(a.startRaw),\n    endTime: excelTimeFractionToHHMM(a.endRaw),\n    duration: normalizeRaw(a.durationRaw) ? String(a.durationRaw) : null,\n    comments: normalizeRaw(a.comments),\n    isDeleted: false,\n    updatedAt: new Date(),\n  }};\n\n  db.activities.updateOne(\n    {{ projectId: project._id, title, date }},\n    {{ $set: doc, $setOnInsert: {{ createdAt: new Date() }} }},\n    {{ upsert: true }}\n  );\n  activityUpserts += 1;\n}}\n\nlet securityUpserts = 0;\nfor (const s of SECURITY_ROWS) {{\n  const title = cleanText(s.title);\n  const date = excelSerialToDate(s.dateRaw) || new Date();\n  if (!title) continue;\n\n  const comments = [normalizeRaw(s.comments), normalizeRaw(s.api)].filter(Boolean).join(\" | API: \") || null;\n\n  const doc = {{\n    projectId: project._id,\n    scope: \"project\",\n    title,\n    date,\n    type: \"security\",\n    environment: \"production\",\n    status: mapActivityStatus(s.statusRaw),\n    comments,\n    isDeleted: false,\n    updatedAt: new Date(),\n  }};\n\n  db.activities.updateOne(\n    {{ projectId: project._id, title, date }},\n    {{ $set: doc, $setOnInsert: {{ createdAt: new Date() }} }},\n    {{ upsert: true }}\n  );\n  securityUpserts += 1;\n}}\n\nprintjson({{\n  projectId: project._id,\n  releaseRowsProcessed: RELEASE_ROWS.length,\n  activityRowsProcessed: ACTIVITY_ROWS.length,\n  securityRowsProcessed: SECURITY_ROWS.length,\n  releaseUpserts,\n  activityUpserts,\n  securityUpserts,\n}});\n"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate mongosh upsert script from release tracker Excel")
    parser.add_argument("--excel", required=True, help="Path to input .xlsx file")
    parser.add_argument("--out-js", default="scripts/generated/import_release_tracker.mongosh.js", help="Output mongosh JS path")
    parser.add_argument("--out-report", default="scripts/generated/import_release_tracker.report.json", help="Output report JSON path")
    parser.add_argument("--out-data", default="scripts/generated/import_release_tracker.data.json", help="Output normalized rows JSON path")
    args = parser.parse_args()

    excel_path = Path(args.excel).expanduser().resolve()
    if not excel_path.exists():
        raise SystemExit(f"Excel file not found: {excel_path}")

    all_rows = load_workbook_rows(excel_path)

    release_rows: List[Dict[str, Any]] = []
    activity_rows: List[Dict[str, Any]] = []
    security_rows: List[Dict[str, Any]] = []

    skipped = {
        "release": 0,
        "activity": 0,
        "security": 0,
        "unknownSheets": [],
    }

    for sheet in RELEASE_SHEETS:
        for row in all_rows.get(sheet, []):
            parsed = parse_release_row(sheet, row)
            if parsed is None:
                skipped["release"] += 1
            else:
                release_rows.append(parsed)

    for sheet in ACTIVITY_SHEETS:
        for row in all_rows.get(sheet, []):
            parsed = parse_activity_row(sheet, row)
            if parsed is None:
                skipped["activity"] += 1
            else:
                activity_rows.append(parsed)

    for row in all_rows.get(SECURITY_SHEET, []):
        parsed = parse_security_row(row)
        if parsed is None:
            skipped["security"] += 1
        else:
            security_rows.append(parsed)

    known = set(RELEASE_SHEETS + ACTIVITY_SHEETS + [SECURITY_SHEET])
    skipped["unknownSheets"] = sorted([k for k in all_rows.keys() if k not in known])

    out_js = Path(args.out_js)
    out_report = Path(args.out_report)
    out_data = Path(args.out_data)
    out_js.parent.mkdir(parents=True, exist_ok=True)
    out_report.parent.mkdir(parents=True, exist_ok=True)
    out_data.parent.mkdir(parents=True, exist_ok=True)

    script_text = generate_mongosh_script(release_rows, activity_rows, security_rows)
    out_js.write_text(script_text, encoding="utf-8")

    report = {
        "excel": str(excel_path),
        "sheetRowCounts": {k: len(v) for k, v in all_rows.items()},
        "generated": {
            "releaseRows": len(release_rows),
            "activityRows": len(activity_rows),
            "securityRows": len(security_rows),
        },
        "skipped": skipped,
        "outputs": {
            "mongoshScript": str(out_js),
            "report": str(out_report),
            "data": str(out_data),
        },
    }

    data_payload = {
        "releaseRows": release_rows,
        "activityRows": activity_rows,
        "securityRows": security_rows,
    }
    out_data.write_text(json.dumps(data_payload, indent=2), encoding="utf-8")
    out_report.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build a normalized taught-postgraduate programme index from the supplied PDFs."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader


PDF_SOURCES = [
    {
        "code": "HKU",
        "name": "The University of Hong Kong",
        "shortName": "香港大学",
        "academicYear": "2025-26",
        "filename": "HKU_Master_Course_Guide.pdf",
        "parser": "hku",
    },
    {
        "code": "CUHK",
        "name": "The Chinese University of Hong Kong",
        "shortName": "香港中文大学",
        "academicYear": "2026-27",
        "filename": "cuhk_postgraduate_programmes.pdf",
        "parser": "cuhk",
    },
    {
        "code": "HKUST",
        "name": "The Hong Kong University of Science and Technology",
        "shortName": "香港科技大学",
        "academicYear": "2026-27",
        "filename": "hkust_pg_catalog_2026_27.pdf",
        "parser": "hkust",
    },
    {
        "code": "POLYU",
        "name": "The Hong Kong Polytechnic University",
        "shortName": "香港理工大学",
        "academicYear": "2027-28",
        "filename": "PolyU_Taught_Masters_2027.pdf",
        "parser": "polyu",
    },
    {
        "code": "CITYU",
        "name": "City University of Hong Kong",
        "shortName": "香港城市大学",
        "academicYear": "2025-26",
        "filename": "CityUHK_Master_Programmes_Guide_2026.pdf",
        "parser": "cityu",
    },
    {
        "code": "HKBU",
        "name": "Hong Kong Baptist University",
        "shortName": "香港浸会大学",
        "academicYear": "2025-26",
        "filename": "HKBU_Taught_Masters_Guide_2025.pdf",
        "parser": "hkbu",
    },
]


def clean(value: str) -> str:
    value = value.replace("\x00", "").replace("\u00a0", " ")
    return re.sub(r"\s+", " ", value).strip(" \t\r\n-–—|")


def programme_id(university_code: str, position: int) -> str:
    return f"{university_code}-TPG-{position:03d}"


def make_programme(
    university_code: str,
    position: int,
    name: str,
    *,
    faculty: str = "",
    code: str = "",
    credits: int | None = None,
    source_url: str = "",
    data_level: str = "programme",
) -> dict:
    return {
        "id": programme_id(university_code, position),
        "universityCode": university_code,
        "programmeCode": code,
        "name": clean(name),
        "faculty": clean(faculty),
        "creditsRequired": credits,
        "sourceUrl": source_url,
        "dataLevel": data_level,
        "courseGroups": [],
    }


def deduplicate(programmes: list[dict]) -> list[dict]:
    seen = set()
    result = []
    for item in programmes:
        key = re.sub(r"[^a-z0-9]+", "", item["name"].lower())
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(item)
    for position, item in enumerate(result, start=1):
        item["id"] = programme_id(item["universityCode"], position)
    return result


def parse_hku(text: str, university_code: str) -> list[dict]:
    raw_lines = text.replace("\x00", "").splitlines()
    programmes = []
    for index, raw_line in enumerate(raw_lines):
        if clean(raw_line) != "Graduation Credit Requirement":
            continue
        faculty_index = index - 1
        while faculty_index >= 0 and not clean(raw_lines[faculty_index]):
            faculty_index -= 1
        faculty = clean(raw_lines[faculty_index]) if faculty_index >= 0 else ""
        if not faculty.startswith("FACULTY OF "):
            continue
        name_lines = []
        cursor = faculty_index - 1
        while cursor >= 0 and clean(raw_lines[cursor]) and len(name_lines) < 3:
            candidate = clean(raw_lines[cursor])
            if candidate.startswith(("Page ", "Confidential", "TAUGHT MASTER", "THE UNIVERSITY")):
                break
            name_lines.insert(0, candidate)
            cursor -= 1
        credit_cursor = index + 1
        while credit_cursor < len(raw_lines) and not clean(raw_lines[credit_cursor]):
            credit_cursor += 1
        credit_match = re.search(r"\d+", clean(raw_lines[credit_cursor])) if credit_cursor < len(raw_lines) else None
        if not name_lines or not credit_match:
            continue
        programmes.append(
            make_programme(
                university_code,
                len(programmes) + 1,
                " ".join(name_lines),
                faculty=faculty,
                credits=int(credit_match.group()),
                data_level="structure",
            )
        )
    return programmes


def parse_cityu(text: str, university_code: str) -> list[dict]:
    pattern = re.compile(
        r"\[(?P<code>P[0-9A-Z]+)\]\s*\n"
        r"(?P<faculty>[^\n]+)\n"
        r"(?P<name>[^\n]+)\n"
        r"Credits Required:\s*(?P<credits>\d+|—)\s*CU.*?"
        r"Programme Code:\s*(?P=code)(?P<tail>.*?)(?=\n\[P[0-9A-Z]+\]|\Z)",
        re.DOTALL,
    )
    programmes = []
    for position, match in enumerate(pattern.finditer(text), start=1):
        url_match = re.search(r"https://www\.cityu\.edu\.hk/\S+", match.group("tail"))
        credits = match.group("credits")
        programmes.append(
            make_programme(
                university_code,
                position,
                match.group("name"),
                faculty=match.group("faculty"),
                code=match.group("code"),
                credits=int(credits) if credits.isdigit() else None,
                source_url=url_match.group(0) if url_match else "",
                data_level="structure" if "COURSES" in match.group("tail") else "programme",
            )
        )
    return programmes


def parse_polyu(text: str, university_code: str) -> list[dict]:
    text = text.replace("\x00", "")
    lines = [clean(line) for line in text.splitlines()]
    programmes = []
    current_department = ""
    for index, line in enumerate(lines):
        if re.search(r"\([A-Z]{2,6}\)$", line) and index + 1 < len(lines):
            current_department = line
        if line != "Code" or index < 1 or index + 1 >= len(lines):
            continue
        code = lines[index + 1]
        name = lines[index - 2] if index >= 2 and re.search(r"[\u3400-\u9fff]", lines[index - 1]) else lines[index - 1]
        if not code.isdigit() or not name or name in {"Code", "Degree"}:
            continue
        window = lines[index + 1:index + 18]
        credits = None
        if "Total Credits" in window:
            credit_index = window.index("Total Credits")
            if credit_index + 1 < len(window):
                credit_match = re.search(r"\d+", window[credit_index + 1])
                credits = int(credit_match.group()) if credit_match else None
        url = next((item for item in window if item.startswith("https://")), "")
        programmes.append(
            make_programme(
                university_code,
                len(programmes) + 1,
                name,
                faculty=current_department,
                code=code,
                credits=credits,
                source_url=url,
                data_level="structure" if "Compulsory Subjects" in window or "Elective Subjects" in window else "programme",
            )
        )
    return programmes


def parse_hkbu(text: str, university_code: str) -> list[dict]:
    toc = text.split("This guide provides detailed information", 1)[0]
    entries = re.findall(
        r"(?:^|\n)(\d+)\.\s+((?:Master|MSc|MA|MSocSc|MEd|MPA|MBA|LLM)[^\n]*(?:\n(?!\d+\.)[^\n]+)?)",
        toc,
    )
    programmes = []
    for number, raw_name in entries:
        name = clean(re.sub(r"\s+\d+$", "", raw_name))
        name = re.sub(r"\(Approved Programme.*$", "", name).strip()
        programmes.append(make_programme(university_code, int(number), name))
    return programmes


def parse_hkust(text: str, university_code: str) -> list[dict]:
    start = text.find("Program Directory")
    end = text.find("\n\nDigital Master of Business Administration", start)
    directory = text[start:end if end > start else len(text)]
    programmes = []
    current = ""
    for raw_line in directory.splitlines():
        line = clean(raw_line)
        has_bullet = "\x7f" in raw_line or raw_line.lstrip().startswith("")
        if has_bullet:
            if current:
                programmes.append(make_programme(university_code, len(programmes) + 1, current))
            current = clean(raw_line.replace("\x7f", "").replace("", ""))
            continue
        if not current or not line:
            continue
        if line.startswith(("HKUST Taught", "WeChat Mini", "Page ")) or re.match(r"^■", line):
            continue
        current = f"{current} {line}"
    if current:
        programmes.append(make_programme(university_code, len(programmes) + 1, current))
    return programmes


def parse_cuhk(text: str, university_code: str) -> list[dict]:
    section = text.split("2. CUHK Taught Master's Programmes List", 1)[-1]
    section = section.split("3. Detailed Course Selection Lists", 1)[0]
    lines = [clean(line) for line in section.splitlines() if clean(line)]
    degree_tokens = {"M.A.", "M.Sc.", "M.S.Sc.", "M.Ed.", "M.Acc.", "M.P.H.", "LL.M.", "MBA"}
    programmes = []
    for index, line in enumerate(lines):
        if line not in degree_tokens or index == 0:
            continue
        name = lines[index - 1]
        if name in {"Degree", "Structure", "Study Period"} or name.startswith("Faculty"):
            continue
        credits = None
        if index + 1 < len(lines):
            credit_match = re.fullmatch(r"\d{2}", lines[index + 1])
            credits = int(credit_match.group()) if credit_match else None
        programmes.append(
            make_programme(
                university_code,
                len(programmes) + 1,
                name,
                credits=credits,
                data_level="structure",
            )
        )
    return programmes


PARSERS = {
    "hku": parse_hku,
    "cuhk": parse_cuhk,
    "hkust": parse_hkust,
    "polyu": parse_polyu,
    "cityu": parse_cityu,
    "hkbu": parse_hkbu,
}


def extract_text(pdf_path: Path) -> tuple[str, int]:
    reader = PdfReader(str(pdf_path))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages), len(reader.pages)


def build_catalogue(pdf_directory: Path) -> dict:
    universities = []
    programmes = []
    for source in PDF_SOURCES:
        pdf_path = pdf_directory / source["filename"]
        if not pdf_path.exists():
            raise FileNotFoundError(pdf_path)
        text, page_count = extract_text(pdf_path)
        parsed = deduplicate(PARSERS[source["parser"]](text, source["code"]))
        universities.append(
            {
                "code": source["code"],
                "name": source["name"],
                "shortName": source["shortName"],
                "academicYear": source["academicYear"],
                "sourceFile": source["filename"],
                "sourcePages": page_count,
                "programmeCount": len(parsed),
                "verificationStatus": "pdf_imported",
            }
        )
        programmes.extend(parsed)
    return {
        "schemaVersion": 1,
        "scope": "taught_postgraduate",
        "universities": universities,
        "programmes": programmes,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    catalogue = build_catalogue(args.pdf_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "ok": True,
                "universities": len(catalogue["universities"]),
                "programmes": len(catalogue["programmes"]),
                "counts": {
                    item["code"]: item["programmeCount"]
                    for item in catalogue["universities"]
                },
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()

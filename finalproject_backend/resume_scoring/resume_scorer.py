#!/usr/bin/env python3
"""
Resume scoring system with OCR, rule-based scoring, and Gemini 2.5 Pro scoring.

Usage example:
python resume_scorer.py --input ./resumes --job-description-file ./job_description.txt --output ./scores.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import google.generativeai as genai
import pdfplumber
import pytesseract
from docx import Document
from pdf2image import convert_from_path
from PIL import Image


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}

KNOWN_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "react",
    "next.js",
    "node.js",
    "django",
    "flask",
    "fastapi",
    "git",
    "ci/cd",
    "tensorflow",
    "pytorch",
    "nlp",
    "data analysis",
    "machine learning",
    "communication",
    "leadership",
    "problem solving",
    "project management",
}

EDUCATION_LEVEL_SCORES = {
    "phd": 25,
    "doctorate": 25,
    "master": 22,
    "mba": 22,
    "bachelor": 18,
    "b.tech": 18,
    "b.e": 18,
    "associate": 12,
    "diploma": 10,
    "high school": 6,
}

WORD_REGEX = re.compile(r"\b\w+\b")
EXPERIENCE_REGEX = re.compile(
    r"(?:(\d{1,2})\+?\s+years?\s+of\s+experience|experience\s*:\s*(\d{1,2})\+?\s+years?|(?:at\s+least\s+)?(\d{1,2})\+?\s+yrs?\s+experience)",
    re.IGNORECASE,
)
EXPERIENCE_SCORE_TABLE: List[Tuple[float, float]] = [
    (10, 35),
    (7, 30),
    (5, 24),
    (3, 18),
    (0.1, 10),
]
REQUIRE_EXPERIENCE_REGEX = re.compile(
    r"(\d+\+?\s+years?\s+of\s+experience|minimum\s+\d+\+?\s+years?|experience\s+required|required\s+experience)",
    re.IGNORECASE,
)
REQUIRE_EDUCATION_REGEX = re.compile(
    r"(bachelor|master|phd|doctorate|degree|required\s+degree|education\s+required)",
    re.IGNORECASE,
)
EDUCATION_LEVEL_PATTERNS = {
    level: re.compile(rf"\b{re.escape(level)}\b", re.IGNORECASE)
    for level in EDUCATION_LEVEL_SCORES
}
SKILL_PATTERNS = {
    skill: re.compile(rf"(?<!\w){re.escape(skill)}(?!\w)", re.IGNORECASE)
    for skill in KNOWN_SKILLS
}


@dataclass
class ScoringWeights:
    hardcoded_weight: float = 0.4
    llm_weight: float = 0.6


class ResumeScoringError(Exception):
    """Raised when resume scoring cannot proceed."""


def clean_and_normalize_text(raw_text: str) -> str:
    """Normalize whitespace and remove control characters."""
    if not raw_text:
        return ""
    cleaned = re.sub(r"[\x00-\x1F\x7F]", " ", raw_text)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def extract_text_from_pdf(file_path: Path) -> str:
    """Extract text from PDF, falling back to OCR for scanned pages."""
    extracted_chunks: List[str] = []

    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_chunks.append(page_text)

        joined = "\n".join(extracted_chunks).strip()
        if len(joined) > 200:
            return joined
    except Exception as exc:
        # Continue to OCR fallback if direct PDF extraction fails.
        extracted_chunks = [f"PDF text extraction failed: {exc}"]

    try:
        images = convert_from_path(str(file_path), dpi=300)
        ocr_chunks = [pytesseract.image_to_string(img) for img in images]
        ocr_text = "\n".join(ocr_chunks).strip()
        if not ocr_text:
            raise ResumeScoringError("OCR returned empty text for PDF.")
        return ocr_text
    except Exception as exc:
        details = " | ".join(extracted_chunks) if extracted_chunks else ""
        raise ResumeScoringError(f"Failed to extract PDF text. {details} OCR error: {exc}") from exc


def extract_text_from_docx(file_path: Path) -> str:
    """Extract text from DOCX files."""
    try:
        doc = Document(str(file_path))
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except Exception as exc:
        raise ResumeScoringError(f"Failed to read DOCX file: {exc}") from exc


def extract_text_from_image(file_path: Path) -> str:
    """Extract text from image files using OCR."""
    try:
        with Image.open(file_path) as img:
            text = pytesseract.image_to_string(img)
        if not text.strip():
            raise ResumeScoringError("OCR returned empty text for image.")
        return text
    except Exception as exc:
        raise ResumeScoringError(f"Failed to OCR image: {exc}") from exc


def extract_resume_text(file_path: Path) -> str:
    """Route file to the correct extraction method based on extension."""
    suffix = file_path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ResumeScoringError(f"Unsupported input format: {suffix}")

    if suffix == ".pdf":
        raw_text = extract_text_from_pdf(file_path)
    elif suffix == ".docx":
        raw_text = extract_text_from_docx(file_path)
    else:
        raw_text = extract_text_from_image(file_path)

    normalized = clean_and_normalize_text(raw_text)
    if not normalized:
        raise ResumeScoringError("No usable text found after extraction and normalization.")
    return normalized


def extract_experience_years(text: str) -> float:
    """Estimate years of experience from common resume expressions."""
    years: List[float] = []
    for groups in EXPERIENCE_REGEX.findall(text):
        value = next((g for g in groups if g), "")
        if value:
            try:
                years.append(float(value))
            except ValueError:
                continue
    return max(years) if years else 0.0


def compute_experience_score(years: float) -> float:
    """Map years of experience to configured score bands."""
    for threshold, score in EXPERIENCE_SCORE_TABLE:
        if years >= threshold:
            return float(score)
    return 0.0


def extract_education_level(text: str) -> str:
    """Find the highest mapped education level in the resume text."""
    for level, pattern in EDUCATION_LEVEL_PATTERNS.items():
        if pattern.search(text):
            return level
    return "unknown"


def extract_skills(text: str, job_description: Optional[str] = None) -> List[str]:
    """Extract known skills from resume and optionally prioritize job-relevant skills."""
    lowered = text.lower()
    lowered_words = set(WORD_REGEX.findall(lowered))
    found: List[str] = []

    for skill in KNOWN_SKILLS:
        # Single-token skills use O(1) set lookup; multi-token/punctuated skills use boundary regex.
        if WORD_REGEX.fullmatch(skill):
            if skill in lowered_words:
                found.append(skill)
        elif SKILL_PATTERNS[skill].search(lowered):
            found.append(skill)

    if job_description:
        jd_words = set(WORD_REGEX.findall(job_description.lower()))
        found.sort(key=lambda s: (s in jd_words, len(s)), reverse=True)

    return sorted(set(found))


def infer_job_requirement_flags(job_description: Optional[str]) -> Dict[str, bool]:
    """Infer whether experience/education are explicit requirements in the job description."""
    jd = (job_description or "").lower()
    if not jd:
        return {"requires_experience": False, "requires_education": False, "is_internship_like": False}

    return {
        "requires_experience": bool(REQUIRE_EXPERIENCE_REGEX.search(jd)),
        "requires_education": bool(REQUIRE_EDUCATION_REGEX.search(jd)),
        "is_internship_like": "intern" in jd or "entry level" in jd,
    }


def hardcoded_score_resume(text: str, job_description: Optional[str] = None) -> Dict[str, Any]:
    """Compute deterministic rule-based scores from extracted features."""
    skills = extract_skills(text, job_description)
    years = extract_experience_years(text)
    education_level = extract_education_level(text)
    flags = infer_job_requirement_flags(job_description)

    skills_score = min(40.0, len(skills) * 4.0)

    base_experience_score = compute_experience_score(years)
    base_education_score = float(EDUCATION_LEVEL_SCORES.get(education_level, 4))

    if flags["requires_experience"]:
        experience_score = base_experience_score
    else:
        # Experience is bonus-only when not explicitly required.
        if years >= 7:
            experience_score = 10.0
        elif years >= 5:
            experience_score = 8.0
        elif years >= 3:
            experience_score = 5.0
        elif years >= 1:
            experience_score = 2.0
        else:
            experience_score = 0.0

    if flags["requires_education"]:
        education_score = base_education_score
    else:
        # Education is bonus-only when not explicitly required.
        if education_level in {"phd", "doctorate"}:
            education_score = 6.0
        elif education_level in {"master", "mba"}:
            education_score = 4.0
        elif education_level in {"bachelor", "b.tech", "b.e"}:
            education_score = 3.0
        else:
            education_score = 0.0

    total = min(100.0, skills_score + experience_score + education_score)

    return {
        "score": round(total, 2),
        "components": {
            "skills_score": round(skills_score, 2),
            "experience_score": round(experience_score, 2),
            "education_score": round(education_score, 2),
        },
        "features": {
            "skills_found": skills,
            "experience_years_estimate": years,
            "education_level_detected": education_level,
            "requirement_flags": flags,
            "base_experience_score": round(base_experience_score, 2),
            "base_education_score": round(base_education_score, 2),
        },
    }


def strip_json_fences(raw: str) -> str:
    """Remove markdown code fences if the model returns them."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def llm_score_resume(
    resume_text: str,
    job_description: str,
    api_key: str,
    model_name: str = "gemini-2.5-pro",
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """Ask Gemini to return deterministic structured scoring JSON."""
    if not job_description.strip():
        raise ResumeScoringError("Job description is required for LLM scoring.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)

    prompt = {
        "task": "Score resume quality and relevance for the provided job description.",
        "instructions": [
            "Return valid JSON only, with no markdown.",
            "Use component scores between 0 and 100.",
            "Be strict and evidence-based.",
        ],
        "output_schema": {
            "llm_score": "number (0-100)",
            "components": {
                "relevance": "number (0-100)",
                "impact": "number (0-100)",
                "achievements": "number (0-100)",
            },
            "highlights": ["string"],
            "risks": ["string"],
            "reasoning_summary": "string",
        },
        "job_description": job_description,
        "resume_text": resume_text,
    }

    try:
        response = model.generate_content(
            json.dumps(prompt),
            generation_config={
                "temperature": temperature,
                "top_p": 0.8,
                "response_mime_type": "application/json",
            },
        )
    except Exception as exc:
        raise ResumeScoringError(f"Gemini request failed: {exc}") from exc

    response_text = getattr(response, "text", "") or ""
    response_text = strip_json_fences(response_text)

    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise ResumeScoringError(f"Gemini did not return valid JSON: {response_text[:200]}") from exc

    llm_score = float(parsed.get("llm_score", 0.0))
    llm_score = max(0.0, min(100.0, llm_score))

    components = parsed.get("components", {}) or {}

    return {
        "score": round(llm_score, 2),
        "components": {
            "relevance": float(components.get("relevance", 0.0)),
            "impact": float(components.get("impact", 0.0)),
            "achievements": float(components.get("achievements", 0.0)),
        },
        "highlights": parsed.get("highlights", []),
        "risks": parsed.get("risks", []),
        "reasoning_summary": parsed.get("reasoning_summary", ""),
    }


def aggregate_scores(hardcoded_score: float, llm_score: float, weights: ScoringWeights) -> float:
    """Aggregate and normalize weighted scores to a 0-100 final score."""
    if weights.hardcoded_weight < 0 or weights.llm_weight < 0:
        raise ResumeScoringError("Scoring weights must be non-negative.")

    total_weight = weights.hardcoded_weight + weights.llm_weight
    if total_weight == 0:
        raise ResumeScoringError("At least one scoring weight must be greater than zero.")

    weighted = (
        hardcoded_score * weights.hardcoded_weight
        + llm_score * weights.llm_weight
    ) / total_weight

    return round(max(0.0, min(100.0, weighted)), 2)


def score_resume(
    resume_path: Path,
    job_description: str,
    api_key: str,
    weights: Optional[ScoringWeights] = None,
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """Score one resume and return complete JSON result."""
    if weights is None:
        weights = ScoringWeights()

    warnings: List[str] = []

    try:
        text = extract_resume_text(resume_path)
    except ResumeScoringError as exc:
        return {
            "file": str(resume_path),
            "status": "error",
            "error": str(exc),
            "final_score": 0.0,
            "breakdown": {},
        }

    hardcoded = hardcoded_score_resume(text, job_description)

    try:
        llm = llm_score_resume(
            resume_text=text,
            job_description=job_description,
            api_key=api_key,
            temperature=temperature,
        )
    except ResumeScoringError as exc:
        warnings.append(f"LLM scoring fallback used: {exc}")
        llm = {
            "score": 0.0,
            "components": {"relevance": 0.0, "impact": 0.0, "achievements": 0.0},
            "highlights": [],
            "risks": ["LLM scoring unavailable"],
            "reasoning_summary": "LLM call failed, so only hard-coded score contributed.",
        }

    final_score = aggregate_scores(hardcoded["score"], llm["score"], weights)

    return {
        "file": str(resume_path),
        "status": "ok",
        "final_score": final_score,
        "breakdown": {
            "hardcoded_score": hardcoded["score"],
            "llm_score": llm["score"],
            "weights": {
                "hardcoded_weight": weights.hardcoded_weight,
                "llm_weight": weights.llm_weight,
            },
            "hardcoded_components": hardcoded["components"],
            "llm_components": llm["components"],
            "extracted_features": hardcoded["features"],
        },
        "highlights": llm.get("highlights", []),
        "explanation": llm.get("reasoning_summary", ""),
        "warnings": warnings,
    }


def list_resume_files(input_path: Path) -> List[Path]:
    """Support both single-file and folder-based batch processing."""
    if input_path.is_file():
        return [input_path]

    if input_path.is_dir():
        files = [
            p for p in input_path.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
        ]
        return sorted(files)

    raise ResumeScoringError(f"Input path does not exist: {input_path}")


def load_job_description(job_description: Optional[str], job_description_file: Optional[Path]) -> str:
    """Load job description from direct text or from file."""
    if job_description and job_description.strip():
        return job_description.strip()

    if job_description_file and job_description_file.exists():
        return job_description_file.read_text(encoding="utf-8").strip()

    raise ResumeScoringError("Provide --job-description or --job-description-file.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Resume scorer using OCR + rules + Gemini 2.5 Pro")
    parser.add_argument("--input", required=True, help="Path to resume file or directory")
    parser.add_argument("--job-description", default="", help="Raw job description text")
    parser.add_argument("--job-description-file", default="", help="Path to job description text file")
    parser.add_argument("--output", default="", help="Path for JSON output file")
    parser.add_argument("--temperature", type=float, default=0.2, help="Gemini temperature (recommended 0.2-0.3)")
    parser.add_argument("--hardcoded-weight", type=float, default=0.4, help="Weight of hard-coded score")
    parser.add_argument("--llm-weight", type=float, default=0.6, help="Weight of LLM score")
    parser.add_argument("--api-key", default="", help="Gemini API key. Falls back to GEMINI_API_KEY env var")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    try:
        input_path = Path(args.input).resolve()
        jd_file = Path(args.job_description_file).resolve() if args.job_description_file else None

        job_description = load_job_description(args.job_description, jd_file)
        api_key = args.api_key or os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ResumeScoringError("Gemini API key missing. Set GEMINI_API_KEY or pass --api-key.")

        if not (0.0 <= args.temperature <= 1.0):
            raise ResumeScoringError("Temperature must be between 0 and 1.")

        weights = ScoringWeights(
            hardcoded_weight=args.hardcoded_weight,
            llm_weight=args.llm_weight,
        )

        resume_files = list_resume_files(input_path)
        if not resume_files:
            raise ResumeScoringError("No supported resume files found in input path.")

        results = [
            score_resume(
                resume_path=resume_file,
                job_description=job_description,
                api_key=api_key,
                weights=weights,
                temperature=args.temperature,
            )
            for resume_file in resume_files
        ]

        payload = {
            "meta": {
                "model": "gemini-2.5-pro",
                "temperature": args.temperature,
                "files_processed": len(results),
            },
            "results": results,
        }

        if args.output:
            output_path = Path(args.output).resolve()
            output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            print(f"Saved results to {output_path}")
        else:
            print(json.dumps(payload, indent=2))

    except ResumeScoringError as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, indent=2))
        raise SystemExit(1)


if __name__ == "__main__":
    main()

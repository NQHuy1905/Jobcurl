"""Score the resume against a company's latest-update jobs.

The scoring instructions are the user's own technical_recuit.md (project root),
read on every run so edits take effect immediately. A short runtime override
tells the model to review one job and answer as JSON instead of markdown.
"""
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import session_store as store
from .config import BACKEND_DIR, settings
from .db import conn
from .extractor import chat

log = logging.getLogger("jobcurl.matcher")

PROMPT_PATH = Path(settings.match_prompt_path) if settings.match_prompt_path else BACKEND_DIR.parent / "technical_recuit.md"
MAX_JOBS = 60
MAX_JD_CHARS = 8000
MAX_TOKENS = 7000
WORKERS = 4
DECISIONS = {"strong shortlist": "Strong shortlist", "shortlist": "Shortlist", "borderline": "Borderline", "reject": "Reject"}

OVERRIDE = """

---
RUNTIME OVERRIDE (takes precedence over the output format above):
The resume and ONE job description are given in the user message, so do not wait for input.
Apply every rule above to this single job. Reply with ONLY a json object (no markdown, no code fences) with these keys,
which map to the numbered output sections:
{
  "score": integer 1-10                                   (section 1),
  "score_reason": string                                  (section 1),
  "decision": "Strong shortlist"|"Shortlist"|"Borderline"|"Reject"   (section 2),
  "decision_reason": string                               (section 2),
  "jd_mapping": [{"requirement": str, "evidence": str, "match": "Strong"|"Medium"|"Weak"|"Missing", "improve": str}]   (section 3, at most 10 rows),
  "missing_keywords": [string]                            (section 4),
  "weak_bullets": [{"quote": str, "why_weak": str, "improved": str}]   (sections 5 and 6, at most 4),
  "recommended_summary": string                           (section 7),
  "recommended_skills": string                            (section 8),
  "top_changes": [string, at most 5]                      (section 9),
  "interview_risks": [string]                             (section 10)
}
Keep every string concise. If the job description is missing or very short, say so in score_reason and score conservatively."""


def _latest_jobs(company_id: int) -> list[dict]:
    with conn() as c:
        rows = c.execute(
            "SELECT id, title, location, url, description, first_seen_date FROM jobs"
            " WHERE company_id = ? AND first_seen_date ="
            "   (SELECT MAX(first_seen_date) FROM jobs WHERE company_id = ?)"
            " ORDER BY id LIMIT ?",
            (company_id, company_id, MAX_JOBS),
        ).fetchall()
    return [dict(r) for r in rows]


def _clean_list(value, limit: int) -> list:
    return value[:limit] if isinstance(value, list) else []


def _normalize(data: dict) -> dict:
    try:
        score = max(1, min(10, int(round(float(data.get("score"))))))
    except (TypeError, ValueError):
        raise ValueError("model returned no valid score")
    decision = DECISIONS.get(str(data.get("decision", "")).strip().lower(), "Borderline")
    return {
        "score": score,
        "decision": decision,
        "score_reason": str(data.get("score_reason") or ""),
        "decision_reason": str(data.get("decision_reason") or ""),
        "jd_mapping": _clean_list(data.get("jd_mapping"), 10),
        "missing_keywords": _clean_list(data.get("missing_keywords"), 30),
        "weak_bullets": _clean_list(data.get("weak_bullets"), 4),
        "recommended_summary": str(data.get("recommended_summary") or ""),
        "recommended_skills": str(data.get("recommended_skills") or ""),
        "top_changes": _clean_list(data.get("top_changes"), 5),
        "interview_risks": _clean_list(data.get("interview_risks"), 10),
    }


def _score_job(system: str, resume: str, job: dict) -> dict:
    description = (job["description"] or "").strip()[:MAX_JD_CHARS] or "(no description was found for this posting)"
    user = (
        f"RESUME:\n{resume}\n\nJOB DESCRIPTION:\nTitle: {job['title']}\n"
        f"Location: {job['location'] or 'n/a'}\nURL: {job['url'] or 'n/a'}\nDescription:\n{description}"
    )
    base = {"job_id": job["id"], "title": job["title"], "location": job["location"], "url": job["url"]}
    last_error = "unknown error"
    for _ in range(2):  # one retry: malformed or truncated JSON is the usual failure
        try:
            return {**base, **_normalize(json.loads(chat(system, user, json_mode=True, max_tokens=MAX_TOKENS))), "error": None}
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {exc}"[:200]
    log.warning("scoring failed for job %s: %s", job["id"], last_error)
    return {**base, "score": None, "decision": None, "error": last_error}


def _run(company_id: int, token: int, system: str, resume: str, jobs: list[dict]) -> None:
    try:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = [pool.submit(_score_job, system, resume, job) for job in jobs]
            for future in futures:
                store.add_result(company_id, token, future.result())
        store.finish_run(company_id, token)
    except Exception as exc:
        log.exception("match run failed for company %s", company_id)
        store.finish_run(company_id, token, f"{type(exc).__name__}: {exc}"[:300])


def start(company_id: int) -> None:
    """Validate, register the run, and score in a background thread.

    Raises ValueError for user-fixable problems and RuntimeError if already running.
    """
    resume = store.get_resume()["text"]
    if not resume:
        raise ValueError("Add your resume first (Resume button).")
    if not settings.llm_configured:
        raise ValueError("DEEPSEEK_API_KEY is not set in backend/.env")
    if not PROMPT_PATH.is_file():
        raise ValueError(f"Scoring instructions not found: {PROMPT_PATH}")
    jobs = _latest_jobs(company_id)
    if not jobs:
        raise ValueError("This company has no recorded positions yet.")

    system = PROMPT_PATH.read_text(encoding="utf-8") + OVERRIDE
    token = store.start_run(company_id, len(jobs), jobs[0]["first_seen_date"])
    if token is None:
        raise RuntimeError("A match is already running for this company.")
    threading.Thread(target=_run, args=(company_id, token, system, resume, jobs), daemon=True).start()

"""FastAPI app: companies, per-day job history, scan triggers."""
import logging
import sqlite3
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import fetcher, matcher, resume_parser, scheduler
from . import session_store as store
from .config import BACKEND_DIR, settings
from .db import conn, init_db
from .mailer import send_test_email
from .scanner import scan_all, scan_company

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(title="Jobcurl", lifespan=lifespan)


class CompanyIn(BaseModel):
    url: str
    name: str | None = None


class ResumeIn(BaseModel):
    text: str
    filename: str | None = None


def _background(fn, *args) -> None:
    threading.Thread(target=fn, args=args, daemon=True).start()


def _default_name(url: str) -> str:
    host = urlparse(url).netloc.lower().removeprefix("www.")
    parts = host.split(".")
    label = parts[-2] if len(parts) >= 2 else parts[0]
    # careers.acme.com / jobs.acme.com -> "Acme"
    return label.replace("-", " ").title()


COMPANY_SELECT = """
SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) AS job_count
FROM companies c
"""


@app.get("/api/status")
def status():
    return {
        "llm_configured": settings.llm_configured,
        "smtp_configured": settings.smtp_configured,
        "email_to": settings.email_to,
        "next_run": scheduler.next_run_iso(),
    }


@app.get("/api/companies")
def list_companies():
    with conn() as c:
        return [dict(r) for r in c.execute(COMPANY_SELECT + " ORDER BY c.id")]


@app.post("/api/companies", status_code=201)
def add_company(body: CompanyIn):
    try:
        url = fetcher.normalize_url(body.url)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    name = (body.name or "").strip() or _default_name(url)
    try:
        with conn() as c:
            cur = c.execute("INSERT INTO companies (name, url) VALUES (?, ?)", (name, url))
            company_id = cur.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, "This website is already added")
    _background(scan_company, company_id)  # baseline scan; no email
    with conn() as c:
        return dict(c.execute(COMPANY_SELECT + " WHERE c.id = ?", (company_id,)).fetchone())


@app.delete("/api/companies/{company_id}", status_code=204)
def delete_company(company_id: int):
    with conn() as c:
        c.execute("DELETE FROM companies WHERE id = ?", (company_id,))


@app.get("/api/companies/{company_id}/history")
def history(company_id: int):
    """Jobs grouped by the day they were first seen, newest day first."""
    with conn() as c:
        rows = c.execute(
            "SELECT id, title, location, url, description, first_seen_date FROM jobs"
            " WHERE company_id = ? ORDER BY first_seen_date DESC, id",
            (company_id,),
        ).fetchall()
    days: dict[str, list] = {}
    for r in rows:
        days.setdefault(r["first_seen_date"], []).append(dict(r))
    return [{"date": d, "jobs": jobs} for d, jobs in days.items()]


@app.post("/api/companies/{company_id}/scan", status_code=202)
def scan_one(company_id: int):
    _background(scan_company, company_id)
    return {"started": True}


@app.post("/api/run-weekly", status_code=202)
def run_weekly_now():
    """Same as the scheduled job: scan everything and email new positions."""
    _background(scan_all, True)
    return {"started": True}


def _resume_view(with_text: bool = True) -> dict:
    r = store.get_resume()
    view = {"has_resume": bool(r["text"]), "filename": r["filename"], "chars": len(r["text"]), "updated_at": r["updated_at"]}
    if with_text:
        view["text"] = r["text"]
    return view


@app.get("/api/resume")
def get_resume():
    return _resume_view()


@app.put("/api/resume")
def put_resume(body: ResumeIn):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Resume text is empty")
    if len(text) > resume_parser.MAX_RESUME_CHARS:
        raise HTTPException(400, f"Resume is too long (max {resume_parser.MAX_RESUME_CHARS} characters)")
    store.set_resume(text, (body.filename or "").strip() or None)
    return _resume_view()


@app.delete("/api/resume", status_code=204)
def delete_resume():
    store.clear_resume()


@app.post("/api/resume/extract")
def extract_resume(file: UploadFile = File(...)):
    """Return the plain text of an uploaded PDF/TXT/MD so the user can review it before saving."""
    data = file.file.read(resume_parser.MAX_UPLOAD_BYTES + 1)
    if len(data) > resume_parser.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File is larger than 5 MB")
    try:
        return {"text": resume_parser.extract_text(file.filename or "", data), "filename": file.filename}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@app.post("/api/companies/{company_id}/match", status_code=202)
def start_match(company_id: int):
    """Score the resume against this company's latest-update positions (in memory only)."""
    try:
        matcher.start(company_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except RuntimeError as exc:
        raise HTTPException(409, str(exc))
    return {"started": True}


@app.get("/api/companies/{company_id}/match")
def get_match(company_id: int):
    return store.get_run(company_id)


@app.post("/api/test-email")
def test_email():
    try:
        send_test_email()
    except Exception as exc:
        raise HTTPException(400, f"{type(exc).__name__}: {exc}")
    return {"sent": True}


# Serve the built React app when present (production-style single-process run).
_dist = Path(BACKEND_DIR).parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="web")

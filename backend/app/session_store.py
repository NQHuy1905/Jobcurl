"""In-memory session state: the resume and per-company match runs.

Nothing here touches the database. It all disappears when the backend stops
(or sooner: replacing/removing the resume clears every match run).
"""
import itertools
import threading
from datetime import datetime, timezone

_lock = threading.Lock()
_tokens = itertools.count(1)
_resume: dict = {"text": "", "filename": None, "updated_at": None}
_runs: dict[int, dict] = {}


def set_resume(text: str, filename: str | None) -> dict:
    with _lock:
        _resume.update(text=text, filename=filename, updated_at=datetime.now(timezone.utc).isoformat())
        _runs.clear()  # results scored against an older resume are stale
        return dict(_resume)


def clear_resume() -> None:
    with _lock:
        _resume.update(text="", filename=None, updated_at=None)
        _runs.clear()


def get_resume() -> dict:
    with _lock:
        return dict(_resume)


def start_run(company_id: int, total: int, job_date: str) -> int | None:
    """Return a run token, or None if a run for this company is already in progress."""
    with _lock:
        current = _runs.get(company_id)
        if current and current["status"] == "running":
            return None
        token = next(_tokens)
        _runs[company_id] = {
            "token": token, "status": "running", "total": total, "done": 0,
            "job_date": job_date, "error": None, "results": [],
        }
        return token


def add_result(company_id: int, token: int, result: dict) -> None:
    with _lock:
        run = _runs.get(company_id)
        if run and run["token"] == token:  # ignore workers of a run that was cleared
            run["results"].append(result)
            run["done"] += 1


def finish_run(company_id: int, token: int, error: str | None = None) -> None:
    with _lock:
        run = _runs.get(company_id)
        if run and run["token"] == token:
            run["status"] = "error" if error else "done"
            run["error"] = error


def get_run(company_id: int) -> dict:
    """Snapshot with results sorted best match first; unscored (failed) jobs last."""
    with _lock:
        run = _runs.get(company_id)
        if not run:
            return {"status": "none"}
        snap = {k: v for k, v in run.items() if k != "token"}
        snap["results"] = sorted(
            run["results"], key=lambda r: (r["score"] is None, -(r["score"] or 0), r["title"].lower())
        )
        return snap

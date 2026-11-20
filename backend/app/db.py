"""SQLite storage. One short-lived connection per call keeps threads safe."""
import contextlib
import sqlite3
from pathlib import Path

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    url           TEXT NOT NULL UNIQUE,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    last_scan_at  TEXT,
    last_error    TEXT,
    scanning      INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_key         TEXT NOT NULL,
    title           TEXT NOT NULL,
    location        TEXT,
    url             TEXT,
    description     TEXT,
    first_seen_date TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (company_id, job_key)
);
CREATE INDEX IF NOT EXISTS idx_jobs_company_date ON jobs (company_id, first_seen_date);
"""


@contextlib.contextmanager
def conn():
    c = sqlite3.connect(settings.db_path, timeout=30)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init_db() -> None:
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    with conn() as c:
        c.execute("PRAGMA journal_mode = WAL")
        c.executescript(SCHEMA)
        # A crash mid-scan would otherwise leave a company stuck as "scanning".
        c.execute("UPDATE companies SET scanning = 0")

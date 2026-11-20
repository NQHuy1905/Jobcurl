"""Scan a company site and store only positions not seen before."""
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from urllib.parse import urlparse, urlunparse

from . import fetcher
from .config import settings
from .db import conn
from .extractor import Listing, extract_description, extract_listings

log = logging.getLogger("jobcurl.scanner")


def _job_key(listing: Listing) -> str:
    """Stable identity: posting URL (sans fragment/utm) when known, else title."""
    if listing.url:
        p = urlparse(listing.url)
        query = "&".join(q for q in p.query.split("&") if q and not q.startswith("utm_"))
        return urlunparse((p.scheme, p.netloc.lower(), p.path.rstrip("/"), "", query, "")).lower()
    return "title:" + re.sub(r"\s+", " ", listing.title.lower()).strip()


def discover_jobs(start_url: str) -> list[Listing]:
    """Read the given page; if it has no listings, follow suggested careers links."""
    queue, visited, found = [start_url], set(), {}
    while queue and len(visited) < settings.max_pages_per_scan:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        try:
            page = fetcher.fetch(url)
        except Exception as exc:  # a dead careers link shouldn't kill the scan
            log.warning("fetch failed %s: %s", url, exc)
            if url == start_url:
                raise
            continue
        result = extract_listings(page)
        for job in result.jobs:
            found.setdefault(_job_key(job), job)
        if not result.jobs:
            queue.extend(u for u in result.careers_links if u not in visited)
        elif found:
            break
    return list(found.values())


def _describe(listing: Listing) -> str:
    if not listing.url:
        return ""
    try:
        return extract_description(listing.title, fetcher.fetch(listing.url))
    except Exception as exc:
        log.warning("description failed %s: %s", listing.url, exc)
        return ""


def _set_scanning(company_id: int) -> dict | None:
    """Atomically claim the company; None if missing or already scanning."""
    with conn() as c:
        cur = c.execute("UPDATE companies SET scanning = 1 WHERE id = ? AND scanning = 0", (company_id,))
        if cur.rowcount == 0:
            return None
        return dict(c.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone())


def scan_company(company_id: int) -> list[dict] | None:
    """Return newly stored jobs, or None if the company is busy/missing."""
    company = _set_scanning(company_id)
    if company is None:
        return None

    new_jobs: list[dict] = []
    error = None
    try:
        listings = discover_jobs(company["url"])
        with conn() as c:
            known = {r["job_key"] for r in c.execute("SELECT job_key FROM jobs WHERE company_id = ?", (company_id,))}
        fresh = [(_job_key(j), j) for j in listings if _job_key(j) not in known]
        fresh = fresh[: settings.max_descriptions_per_scan]

        with ThreadPoolExecutor(max_workers=4) as pool:
            descriptions = list(pool.map(lambda kj: _describe(kj[1]), fresh))

        today = date.today().isoformat()
        with conn() as c:
            for (key, job), desc in zip(fresh, descriptions):
                cur = c.execute(
                    "INSERT OR IGNORE INTO jobs (company_id, job_key, title, location, url, description, first_seen_date)"
                    " VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (company_id, key, job.title, job.location, job.url, desc, today),
                )
                if cur.rowcount:
                    new_jobs.append({"title": job.title, "location": job.location, "url": job.url})
        if not listings:
            error = "No open positions found (the page may need JavaScript, or there are none)."
    except Exception as exc:
        log.exception("scan failed for company %s", company_id)
        error = f"{type(exc).__name__}: {exc}"[:300]
    finally:
        with conn() as c:
            c.execute(
                "UPDATE companies SET scanning = 0, last_scan_at = datetime('now'), last_error = ? WHERE id = ?",
                (error, company_id),
            )
    return new_jobs


def scan_all(send_email: bool) -> dict[str, list[dict]]:
    """Scan every company; optionally email a digest of new positions."""
    from .mailer import send_digest  # local import: mailer is optional config

    with conn() as c:
        companies = [dict(r) for r in c.execute("SELECT id, name FROM companies ORDER BY id")]
    digest: dict[str, list[dict]] = {}
    for company in companies:
        new = scan_company(company["id"])
        if new:
            digest[company["name"]] = new
    if send_email and digest:
        try:
            send_digest(digest)
        except Exception:
            log.exception("sending digest email failed")
    return digest

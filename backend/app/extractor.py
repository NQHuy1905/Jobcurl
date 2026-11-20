"""DeepSeek-backed (OpenAI-compatible API) extraction of job listings and descriptions."""
import json
from dataclasses import dataclass, field

from openai import OpenAI

from .config import settings
from .fetcher import Page

_client: OpenAI | None = None


def _llm() -> OpenAI:
    global _client
    if not settings.llm_configured:
        raise RuntimeError("DEEPSEEK_API_KEY is not set in backend/.env")
    if _client is None:
        _client = OpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)
    return _client


@dataclass
class Listing:
    title: str
    location: str | None
    url: str | None


@dataclass
class ListingResult:
    jobs: list[Listing] = field(default_factory=list)
    careers_links: list[str] = field(default_factory=list)


LISTING_SYSTEM = """You extract currently open job postings from a company web page.
You receive the page URL, its visible text, and its links as "anchor text | href".
Reply with JSON: {"jobs": [{"title": str, "location": str|null, "url": str|null}], "careers_links": [str]}.
Rules:
- "jobs": only real open positions that are listed on THIS page. Never invent any. Skip navigation, teams, benefits, blog posts and generic "Careers" links.
- "url" must be copied exactly from the provided links (the link to that specific posting), else null.
- "careers_links": only when this page does not itself list positions; give up to 3 links from the provided links most likely to lead to the open-positions list (careers/jobs page or an applicant-tracking board). Otherwise [].
- If the page lists no positions, return {"jobs": [], "careers_links": [...]}."""

DESCRIPTION_SYSTEM = """You receive the text of a single job posting page.
Write the job description faithfully from the page only: a one-line summary, then Responsibilities, Requirements, and Compensation/Location/Type if stated.
Plain text with short "-" bullet lines, at most 350 words. Do not invent details. If the page is not a job posting, reply with exactly: NO_DESCRIPTION"""


def chat(system: str, user: str, json_mode: bool, max_tokens: int | None = None) -> str:
    kwargs = {"response_format": {"type": "json_object"}, "max_tokens": max_tokens or 4096} if json_mode else {"max_tokens": max_tokens or 1500}
    # DeepSeek JSON mode can return blank content on invalid output; retry once.
    for attempt in range(2):
        resp = _llm().chat.completions.create(
            model=settings.deepseek_model,
            temperature=0,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            **kwargs,
        )
        content = (resp.choices[0].message.content or "").strip()
        if content or not json_mode:
            return content
    raise RuntimeError("DeepSeek returned empty JSON output twice")


def extract_listings(page: Page) -> ListingResult:
    links = "\n".join(f"{text} | {href}" for text, href in page.links)
    user = f"PAGE URL: {page.url}\n\nTEXT:\n{page.text}\n\nLINKS:\n{links}"
    data = json.loads(chat(LISTING_SYSTEM, user, json_mode=True))

    valid = {href for _, href in page.links}
    result = ListingResult()
    for item in data.get("jobs") or []:
        title = (item.get("title") or "").strip()
        if not title:
            continue
        url = item.get("url")
        result.jobs.append(
            Listing(title=title, location=(item.get("location") or None), url=url if url in valid else None)
        )
    result.careers_links = [u for u in (data.get("careers_links") or []) if u in valid][:3]
    return result


def extract_description(title: str, page: Page) -> str:
    user = f"JOB TITLE: {title}\n\nPAGE TEXT:\n{page.text}"
    out = chat(DESCRIPTION_SYSTEM, user, json_mode=False).strip()
    return "" if out == "NO_DESCRIPTION" else out

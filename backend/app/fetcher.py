"""Fetch a web page and reduce it to text + links for the LLM."""
import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Accept-Language": "en",
}
MAX_TEXT = 24000
MAX_LINKS = 400


@dataclass
class Page:
    url: str
    title: str
    text: str
    links: list[tuple[str, str]] = field(default_factory=list)  # (anchor text, absolute href)


def normalize_url(raw: str) -> str:
    raw = raw.strip()
    if not re.match(r"^https?://", raw, re.I):
        raw = "https://" + raw
    parsed = urlparse(raw)
    if not parsed.netloc or "." not in parsed.netloc:
        raise ValueError("Invalid website URL")
    return raw


def fetch(url: str) -> Page:
    with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=20) as client:
        resp = client.get(url)
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    final_url = str(resp.url)
    links, seen = [], set()
    for a in soup.find_all("a", href=True):
        href = urljoin(final_url, a["href"]).split("#")[0]
        if not href.startswith("http") or href in seen:
            continue
        seen.add(href)
        links.append((a.get_text(" ", strip=True)[:120], href))

    text = re.sub(r"\n\s*\n+", "\n", soup.get_text("\n", strip=True))
    title = soup.title.get_text(strip=True) if soup.title else ""
    return Page(url=final_url, title=title, text=text[:MAX_TEXT], links=links[:MAX_LINKS])

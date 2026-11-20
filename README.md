# Jobcurl

Paste a company website and Jobcurl finds its open positions, keeps a per-day history of newly posted roles, emails you a weekly digest, and can score your resume against the latest openings.

## Demo

![Jobcurl demo: add a company, see the per-day history, get the Monday digest, score your resume](docs/media/jobcurl-demo.gif)


## Features

- **Company tabs.** Add a company by pasting its website or careers page. Each company gets its own tab.
- **Per-day history.** Only newly posted positions are recorded. A day with several new roles is listed as dash lines, and each role expands to its job description.
- **Weekly digest.** Every Monday at 09:00 (configurable) all companies are scanned, and one email is sent only if something is new: "Company A has open position: …".
- **Resume match.** Upload or paste your resume, click **Find match** in a company tab, and the latest openings are scored 1–10 and sorted best to weakest, with a full review per job. Scoring instructions come from [`technical_recuit.md`](technical_recuit.md), which you can edit. Nothing is stored: the resume and results live in backend memory only.

## How it works

```
React (Vite) ──/api──▶ FastAPI ──▶ SQLite (companies, jobs)
                          │
                          ├─ fetcher + DeepSeek API: page text → job listings → descriptions
                          ├─ APScheduler: weekly scan → SMTP digest
                          └─ in-memory session: resume + match results
```

The DeepSeek API is OpenAI-compatible, so the `openai` Python SDK is used with a custom base URL. If a page has no listings, up to three links the model picks are followed, with at most 4 pages fetched per scan.

## Quick start

Requirements: Python 3.10+, Node 18+, a [DeepSeek API key](https://platform.deepseek.com/api_keys), and optionally a Gmail app password for email.

```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # fill DEEPSEEK_API_KEY and SMTP_* / EMAIL_TO

# frontend
cd ../frontend && npm install && cd ..

# ports (optional)
cp .env.example .env          # FRONTEND_PORT / BACKEND_PORT

./jobcurl.sh start            # open http://127.0.0.1:3010
```

`./jobcurl.sh {start|stop|restart|status|logs}` manages both services in the background. PIDs and logs are in `.run/`. Ports come from the root `.env` (defaults: frontend 3010, backend 8010), and shell variables override it.

## Configuration

Secrets and behaviour are in `backend/.env` (see [`backend/.env.example`](backend/.env.example)).

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | Required for scans and resume matching |
| `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL` | Default `deepseek-flash`, `https://api.deepseek.com` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Outgoing mail (Gmail needs an app password) |
| `EMAIL_FROM`, `EMAIL_TO` | Sender and digest recipient |
| `SCHEDULE_DAY`, `SCHEDULE_HOUR`, `SCHEDULE_MINUTE`, `SCHEDULE_TZ` | Weekly run, default Monday 09:00 machine-local time |
| `MATCH_PROMPT_PATH` | Alternative scoring instructions file |

The dark band at the bottom of the page has **Run weekly scan now** and **Send test email** buttons for checking your setup without waiting for Monday.

## Re-render the demo video

The video is a [Remotion](https://www.remotion.dev) project in [`video/`](video). Edit the scenes in `video/src/scenes/`, then:

```bash
cd video
npm install
npm run studio        # live preview
npm run render:mp4    # writes docs/media/jobcurl-demo.mp4
npm run render:gif    # converts it to docs/media/jobcurl-demo.gif (needs ffmpeg)
```

## Limits

- Career pages that render their job list only with JavaScript return no positions. The company shows a warning instead of failing quietly.
- The weekly scheduler runs inside the backend process, so the backend must be running at the scheduled time. A run missed by up to 6 hours is still executed.
- Positions that disappear from a careers page stay in the history.
- Page text and your resume text are sent to the DeepSeek API.

More detail in [`docs/setup.md`](docs/setup.md).

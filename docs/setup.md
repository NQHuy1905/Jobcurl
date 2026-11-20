# Jobcurl setup

Paste a company website → Jobcurl finds open positions (DeepSeek API), stores them per company by day, and emails new ones every Monday 09:00.

## One-time

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env        # fill DEEPSEEK_API_KEY and SMTP_* / EMAIL_TO
cd ../frontend && npm install && npm run build
```

Gmail: enable 2-step verification, create an App Password, put it in `SMTP_PASSWORD`.

## Run

```bash
./jobcurl.sh start      # backend :8010 + frontend :3010
./jobcurl.sh status
./jobcurl.sh logs
./jobcurl.sh stop       # also: restart
```

Open http://127.0.0.1:3010. Change ports with env vars: `FRONTEND_PORT=4000 BACKEND_PORT=9000 ./jobcurl.sh start`. PIDs and logs live in `.run/`. The script refuses to start if a port is already taken.

The weekly scheduler lives inside the backend process, so it must be running (machine on) on Monday 09:00. Schedule and timezone: `SCHEDULE_*` in `backend/.env`.

## Behavior

- Adding a company runs a baseline scan (recorded under today, no email).
- Each scan stores only positions not seen before (keyed by posting URL, else title). A day with several new positions is listed as dash lines.
- Weekly job: scan all companies, email one digest ("Company A has open position: …") only if something is new.
- Limits: pages that render jobs only via JavaScript return no positions (the company shows a warning). Scan cost is bounded by `max_pages_per_scan` and `max_descriptions_per_scan` in `backend/app/config.py`.

## Resume match

- **Resume** button (header): upload a PDF/TXT/MD (text is extracted for review) or paste text, then save. Scanned/image PDFs have no text, so paste instead.
- **Find match** (company tab): scores the resume against that company's latest update, i.e. the positions first seen on its most recent day, and opens the **Match** sub-tab. Results are sorted best to weakest; click a job for the full review (requirement mapping, missing keywords, improved bullets, recommended summary/skills, top changes, interview risks).
- Scoring instructions are `technical_recuit.md` in the project root, read on every run, so you can edit it. Override the path with `MATCH_PROMPT_PATH` in `backend/.env`. A runtime note appended to it asks for one JSON object per job instead of markdown.
- Nothing is stored: the resume and results live in backend memory only. Stopping/restarting the backend, or replacing/removing the resume, clears them. The resume text is sent to the DeepSeek API while scoring.
- Cost: one LLM call per job in the latest update (up to 60), 4 in parallel. About 65 s for 9 jobs.


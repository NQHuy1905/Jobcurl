"""Weekly scan job (default Monday 09:00 local time)."""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from .config import settings
from .scanner import scan_all

log = logging.getLogger("jobcurl.scheduler")
_scheduler: BackgroundScheduler | None = None


def run_weekly() -> None:
    log.info("weekly scan started")
    digest = scan_all(send_email=True)
    log.info("weekly scan done, %d companies with new positions", len(digest))


def start() -> None:
    global _scheduler
    _scheduler = BackgroundScheduler(timezone=settings.schedule_tz)
    _scheduler.add_job(
        run_weekly,
        CronTrigger(
            day_of_week=settings.schedule_day,
            hour=settings.schedule_hour,
            minute=settings.schedule_minute,
            timezone=settings.schedule_tz,
        ),
        id="weekly-scan",
        # Tolerate the machine waking up late (up to 6h) instead of skipping the week.
        misfire_grace_time=6 * 3600,
        coalesce=True,
    )
    _scheduler.start()


def stop() -> None:
    if _scheduler:
        _scheduler.shutdown(wait=False)


def next_run_iso() -> str | None:
    job = _scheduler.get_job("weekly-scan") if _scheduler else None
    return job.next_run_time.isoformat() if job and job.next_run_time else None

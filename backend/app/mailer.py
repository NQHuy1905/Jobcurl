"""SMTP digest email: 'Company A has open position ...'."""
import html
import smtplib
from datetime import datetime
from email.message import EmailMessage

from .config import settings


def _line(job: dict) -> str:
    loc = f" ({job['location']})" if job.get("location") else ""
    return f"{job['title']}{loc}"


def build_message(digest: dict[str, list[dict]]) -> EmailMessage:
    now = datetime.now()
    when = now.strftime("%A, %d %b %Y")
    names = ", ".join(digest)

    text, rows = [f"New open positions found on {when}:", ""], []
    for company, jobs in digest.items():
        text.append(f"{company} has open position:")
        rows.append(f"<h3 style='margin:16px 0 4px'>{html.escape(company)} has open position:</h3><ul>")
        for job in jobs:
            text.append(f"- {_line(job)}" + (f"\n  {job['url']}" if job.get("url") else ""))
            label = html.escape(_line(job))
            rows.append(
                f"<li><a href='{html.escape(job['url'])}'>{label}</a></li>" if job.get("url") else f"<li>{label}</li>"
            )
        rows.append("</ul>")
        text.append("")

    msg = EmailMessage()
    msg["Subject"] = f"New job openings: {names}"
    msg["From"] = settings.email_from
    msg["To"] = settings.email_to
    msg.set_content("\n".join(text))
    msg.add_alternative(
        f"<div style='font-family:sans-serif'><p>New open positions found on {html.escape(when)}:</p>{''.join(rows)}</div>",
        subtype="html",
    )
    return msg


def _send(msg: EmailMessage) -> None:
    if not settings.smtp_configured:
        raise RuntimeError("SMTP_USER, SMTP_PASSWORD and EMAIL_TO must be set in backend/.env")
    if settings.smtp_port == 465:
        server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30)
    else:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30)
        server.starttls()
    with server:
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def send_digest(digest: dict[str, list[dict]]) -> None:
    _send(build_message(digest))


def send_test_email() -> None:
    msg = EmailMessage()
    msg["Subject"] = "Jobcurl test email"
    msg["From"] = settings.email_from
    msg["To"] = settings.email_to
    msg.set_content("Email delivery works. You will get a digest here when new positions are found.")
    _send(msg)

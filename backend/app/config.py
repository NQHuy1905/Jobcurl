"""Environment-driven settings."""
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    # DeepSeek exposes an OpenAI-compatible API, so the openai SDK is used with a custom base URL.
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-flash")
    deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    email_from = os.getenv("EMAIL_FROM", "") or os.getenv("SMTP_USER", "")
    email_to = os.getenv("EMAIL_TO", "")

    schedule_day = os.getenv("SCHEDULE_DAY", "mon")
    schedule_hour = int(os.getenv("SCHEDULE_HOUR", "9"))
    schedule_minute = int(os.getenv("SCHEDULE_MINUTE", "0"))
    schedule_tz = os.getenv("SCHEDULE_TZ") or None  # None -> machine local tz

    # Scoring instructions for "Find match"; default is technical_recuit.md in the project root.
    match_prompt_path = os.getenv("MATCH_PROMPT_PATH", "")

    db_path = os.getenv("DB_PATH", str(BACKEND_DIR / "data" / "jobcurl.db"))

    # Bounds on LLM cost per company scan.
    max_pages_per_scan = 4
    max_descriptions_per_scan = 40

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_user and self.smtp_password and self.email_to)

    @property
    def llm_configured(self) -> bool:
        return bool(self.deepseek_api_key)


settings = Settings()

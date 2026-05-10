
import os
import requests
import logging

logger = logging.getLogger("telegram_service")

class TelegramService:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.is_active = bool(self.token and self.chat_id)
        
        if not self.is_active:
            logger.warning("Telegram Alerting is DISABLED (Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)")

    def send_message(self, message: str):
        """Sends a message via Telegram Bot API."""
        if not self.is_active:
            return False
            
        try:
            url = f"https://api.telegram.org/bot{self.token}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code != 200:
                logger.error(f"Telegram API error: {resp.text}")
                return False
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False

    def notify_daily_report(self, tasks_done: int, errors: int, uptime: str):
        """Sends a nicely formatted daily status report."""
        msg = (
            "📊 *Raport Automatyzacji*\n"
            "--------------------------\n"
            f"✅ Przetworzono: `{tasks_done}`\n"
            f"❌ Błędy: `{errors}`\n"
            f"⏱️ Uptime: `{uptime}`\n"
            "--------------------------\n"
            "🤖 System pracuje stabilnie."
        )
        return self.send_message(msg)

    def notify_critical_error(self, error_msg: str):
        """Sends a critical alert."""
        msg = (
            "🚨 *ALERM KRYTYCZNY*\n"
            "--------------------------\n"
            f"Błąd: `{error_msg}`\n"
            "--------------------------\n"
            "🛠️ Wymagana interwencja logów."
        )
        return self.send_message(msg)

# Singleton instance
telegram_service = TelegramService()

import time
import json
from datetime import datetime

class Logger:
    @staticmethod
    def log(level, component, message, data=None):
        timestamp = datetime.now().isoformat()
        entry = {
            "timestamp": timestamp,
            "level": level,
            "component": component,
            "message": message
        }
        if data:
            entry["data"] = data
            
        # For now, print to console. Could be extended to file/DB.
        if level in ["ERROR", "CRITICAL"]:
            print(f"🔴 [{timestamp}] {level} [{component}]: {message}")
        elif level == "WARNING":
            print(f"🟡 [{timestamp}] {level} [{component}]: {message}")
        elif level == "SUCCESS":
            print(f"🟢 [{timestamp}] {level} [{component}]: {message}")
        else:
            print(f"ℹ️  [{timestamp}] {level} [{component}]: {message}")

    @staticmethod
    def info(component, message): Logger.log("INFO", component, message)
    @staticmethod
    def success(component, message): Logger.log("SUCCESS", component, message)
    @staticmethod
    def warning(component, message): Logger.log("WARNING", component, message)
    @staticmethod
    def error(component, message, error=None): Logger.log("ERROR", component, message, str(error) if error else None)

class RateLimiter:
    def __init__(self, min_delay=0.5):
        self.min_delay = min_delay
        self.last_request_time = 0

    def wait(self):
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()

    def backoff(self, attempt):
        """Exponential backoff: 2s, 4s, 8s..."""
        sleep_time = 2 * (attempt + 1)
        print(f"⏳ Rate Limit / Error. Sleeping {sleep_time}s...")
        time.sleep(sleep_time)

from datetime import date, datetime

def calculate_days_since(target_date: date) -> int:
    """
    Oblicza ile dni minęło od podanej daty do dzisiaj.
    Jeśli data jest z przyszłości, zwraca ujemną liczbę.
    """
    if isinstance(target_date, datetime):
        target_date = target_date.date()
        
    today = date.today()
    delta = today - target_date
    return delta.days

def is_stale(target_date: date, threshold_days: int = 30) -> bool:
    """
    Sprawdza, czy dane są 'przeterminowane' (starsze niż próg).
    """
    days = calculate_days_since(target_date)
    return days > threshold_days

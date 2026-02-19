import pytest
from datetime import date, timedelta
from backend.utils.date_utils import calculate_days_since, is_stale

def test_calculate_days_since_past():
    # Arrange (Przygotowanie)
    today = date.today()
    past_date = today - timedelta(days=10)
    
    # Act (Działanie)
    result = calculate_days_since(past_date)
    
    # Assert (Sprawdzenie)
    assert result == 10

def test_calculate_days_since_future():
    # Arrange
    today = date.today()
    future_date = today + timedelta(days=5)
    
    # Act
    result = calculate_days_since(future_date)
    
    # Assert
    assert result == -5

def test_is_stale_true():
    # Arrange
    stale_date = date.today() - timedelta(days=31)
    
    # Act
    result = is_stale(stale_date, threshold_days=30)
    
    # Assert
    assert result is True

def test_is_stale_false():
    # Arrange
    fresh_date = date.today() - timedelta(days=29)
    
    # Act
    result = is_stale(fresh_date, threshold_days=30)
    
    # Assert
    assert result is False

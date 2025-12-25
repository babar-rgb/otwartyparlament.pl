import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session(retries=5, backoff_factor=1):
    """
    Create a robust HTTP session with retry logic.
    Standard for all ETL jobs.
    """
    session = requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[500, 502, 503, 504]
    )
    session.mount('https://', HTTPAdapter(max_retries=retry))
    session.mount('http://', HTTPAdapter(max_retries=retry))
    return session

# Singleton session for reuse
http_session = create_session()

from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    """Test that the API is up and running."""
    # Assuming there's a root or general endpoint, or we check /search without params
    # We will use the unified search as the main test target
    response = client.get("/search?q=test")
    # Even if empty or 500 (if no data), we want to see if it responds
    # Note: Without data in sqlite, it should return likely 200 with empty list
    assert response.status_code in [200, 404]

def test_unified_search_structure_empty(client: TestClient):
    """Test response structure for empty search."""
    response = client.get("/search?q=NonExistentEntity12345")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_pagination_params(client: TestClient):
    """Test that the endpoint accepts params without crashing."""
    response = client.get("/search?q=Sejm&type=vote&period=term10")
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        # 500 implies a bug even with empty DB
        assert response.status_code != 500


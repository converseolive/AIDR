import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_aidr_config_safe_url(client):
    response = client.post('/api/aidr-config', json={
        "token": "test-token",
        "base_url": "https://api.us-2.crowdstrike.com/aidr/aiguard"
    })
    # Since it's a test token, it might fail auth, but shouldn't be 400 for unsafe URL
    assert response.status_code in [200, 500]
    if response.status_code == 400:
        assert b"Invalid or unsafe AIDR base URL" not in response.data

def test_aidr_config_unsafe_url(client):
    response = client.post('/api/aidr-config', json={
        "token": "test-token",
        "base_url": "http://169.254.169.254"
    })
    assert response.status_code == 400
    assert b"Invalid or unsafe AIDR base URL" in response.data

def test_aidr_config_localhost_url(client):
    response = client.post('/api/aidr-config', json={
        "token": "test-token",
        "base_url": "http://localhost:8080"
    })
    assert response.status_code == 400
    assert b"Invalid or unsafe AIDR base URL" in response.data

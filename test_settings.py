import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_settings_safe_url(client):
    response = client.post('/api/settings', json={
        "ollama_url": "http://localhost:11434"
    })
    assert response.status_code == 200
    assert b"ok" in response.data

def test_settings_unsafe_url(client):
    response = client.post('/api/settings', json={
        "ollama_url": "http://169.254.169.254"
    })
    assert response.status_code == 400
    assert b"Invalid or unsafe Ollama URL" in response.data

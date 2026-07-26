import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_save_settings_ssrf(client):
    # Valid url
    response = client.post('/api/settings', json={
        'ollama_url': 'http://localhost:11434'
    })
    assert response.status_code == 200

    # Invalid url
    response = client.post('/api/settings', json={
        'ollama_url': 'http://169.254.169.254'
    })
    assert response.status_code == 400
    assert 'Invalid or blocked Ollama URL' in response.json['error']

def test_aidr_config_ssrf(client):
    # Valid url
    response = client.post('/api/aidr-config', json={
        'token': 'test_token',
        'base_url': 'https://api.us-2.crowdstrike.com/aidr/aiguard'
    })
    assert response.status_code == 200

    # Invalid url
    response = client.post('/api/aidr-config', json={
        'token': 'test_token',
        'base_url': 'http://127.0.0.1'
    })
    assert response.status_code == 400
    assert 'Invalid or blocked AIDR base URL' in response.json['error']

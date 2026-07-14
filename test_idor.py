import pytest
from app import app, chat_sessions
from flask import session

@pytest.fixture
def client1():
    app.config['TESTING'] = True
    app.secret_key = 'test-secret'
    return app.test_client()

@pytest.fixture
def client2():
    app.config['TESTING'] = True
    app.secret_key = 'test-secret'
    return app.test_client()

def test_idor_vulnerabilities(client1, client2):
    # Setup: Empty chat sessions initially
    chat_sessions.clear()

    # Hit index to initialize sessions
    client1.get('/')
    client2.get('/')

    # Client 1 sets a provider to bypass the API key check
    client1.post('/api/settings', json={'provider': 'ollama'})

    # Client 1 creates a chat
    resp1 = client1.post('/api/chats')
    assert resp1.status_code == 200
    chat_id1 = resp1.json['id']

    # Client 2 creates a chat
    resp2 = client2.post('/api/chats')
    assert resp2.status_code == 200
    chat_id2 = resp2.json['id']

    # Verify IDOR on listing chats
    resp1_list = client1.get('/api/chats')
    assert len(resp1_list.json['chats']) == 1
    assert resp1_list.json['chats'][0]['id'] == chat_id1

    # Verify IDOR on GET chat
    resp_get_unauth = client1.get(f'/api/chats/{chat_id2}')
    assert resp_get_unauth.status_code == 404

    # Verify IDOR on DELETE chat
    resp_del_unauth = client1.delete(f'/api/chats/{chat_id2}')
    assert resp_del_unauth.status_code == 403

    # Verify IDOR on RENAME chat
    resp_rename_unauth = client1.post(f'/api/chats/{chat_id2}/rename', json={'title': 'Hacked!'})
    assert resp_rename_unauth.status_code == 404

    # Verify IDOR on CHAT endpoint
    resp_chat_unauth = client1.post('/api/chat', json={'chat_id': chat_id2, 'message': 'Hello'})
    assert resp_chat_unauth.status_code == 403

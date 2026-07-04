import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    with app.test_client() as client:
        yield client

def test_idor_get_chat(client):
    # Clear sessions for predictable state
    chat_sessions.clear()

    # Create a chat with session_id 'user_A'
    chat_sessions['chat123'] = {
        'id': 'chat123',
        'title': 'Secret Chat',
        'messages': [],
        'session_id': 'user_A'
    }

    # Simulate user_B trying to access user_A's chat
    with client.session_transaction() as sess:
        sess['session_id'] = 'user_B'

    response = client.get('/api/chats/chat123')
    assert response.status_code == 404
    assert b"Chat not found" in response.data

def test_idor_delete_chat(client):
    chat_sessions.clear()
    chat_sessions['chat123'] = {
        'id': 'chat123',
        'title': 'Secret Chat',
        'messages': [],
        'session_id': 'user_A'
    }

    with client.session_transaction() as sess:
        sess['session_id'] = 'user_B'

    response = client.delete('/api/chats/chat123')
    assert response.status_code == 404
    assert b"Chat not found" in response.data
    assert 'chat123' in chat_sessions

def test_idor_rename_chat(client):
    chat_sessions.clear()
    chat_sessions['chat123'] = {
        'id': 'chat123',
        'title': 'Secret Chat',
        'messages': [],
        'session_id': 'user_A'
    }

    with client.session_transaction() as sess:
        sess['session_id'] = 'user_B'

    response = client.post('/api/chats/chat123/rename', json={'title': 'Hacked'})
    assert response.status_code == 404
    assert b"Chat not found" in response.data
    assert chat_sessions['chat123']['title'] == 'Secret Chat'

def test_idor_list_chats(client):
    chat_sessions.clear()
    chat_sessions['chat123'] = {
        'id': 'chat123',
        'title': 'User A Chat',
        'messages': [],
        'session_id': 'user_A',
        'updated_at': '2023-01-01T00:00:00Z'
    }
    chat_sessions['chat456'] = {
        'id': 'chat456',
        'title': 'User B Chat',
        'messages': [],
        'session_id': 'user_B',
        'updated_at': '2023-01-01T00:00:00Z'
    }

    with client.session_transaction() as sess:
        sess['session_id'] = 'user_A'

    response = client.get('/api/chats')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['chats']) == 1
    assert data['chats'][0]['id'] == 'chat123'

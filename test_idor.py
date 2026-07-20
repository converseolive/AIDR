import pytest
import uuid
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret"
    with app.test_client() as client:
        yield client

def test_session_initialization(client):
    # Hit an API directly without going to index()
    # To check if session is initialized before request
    response = client.get("/api/settings")
    assert response.status_code == 200

    # We should have session_id in the session now
    # Access session in a test context
    with client.session_transaction() as sess:
        assert "session_id" in sess, "Session ID not initialized globally"

def test_idor_chat_isolation(client):
    chat_sessions.clear()

    # Create a chat for User A
    with client.session_transaction() as sess:
        sess["session_id"] = "user-a-123"

    response = client.post("/api/chats")
    assert response.status_code == 200
    chat_id = response.json["id"]

    # User B tries to access it
    with client.session_transaction() as sess:
        sess["session_id"] = "user-b-456"

    # Get chat - Should be Forbidden
    resp_get = client.get(f"/api/chats/{chat_id}")
    assert resp_get.status_code == 403, f"IDOR Vulnerability: User B could access User A's chat. Status: {resp_get.status_code}"

    # Rename chat - Should be Forbidden
    resp_rename = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked"})
    assert resp_rename.status_code == 403

    # Delete chat - Should be Forbidden
    resp_delete = client.delete(f"/api/chats/{chat_id}")
    assert resp_delete.status_code == 403

    # List chats should not show User A's chat to User B
    resp_list = client.get("/api/chats")
    assert len(resp_list.json["chats"]) == 0

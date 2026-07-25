import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.secret_key = "test-secret"
    with app.test_client() as client:
        yield client

def test_index_initializes_session(client):
    response = client.get("/")
    assert response.status_code == 200
    with client.session_transaction() as sess:
        assert "session_id" in sess

def test_create_chat(client):
    with client.session_transaction() as sess:
        sess["session_id"] = "user1"
    response = client.post("/api/chats")
    assert response.status_code == 200
    chat_id = response.json["id"]
    assert chat_sessions[chat_id]["user_id"] == "user1"

def test_idor_get_chat(client):
    chat_id = "test_chat"
    chat_sessions[chat_id] = {"id": chat_id, "user_id": "user1"}

    with client.session_transaction() as sess:
        sess["session_id"] = "user2"

    response = client.get(f"/api/chats/{chat_id}")
    assert response.status_code == 403

    with client.session_transaction() as sess:
        sess["session_id"] = "user1"

    response = client.get(f"/api/chats/{chat_id}")
    assert response.status_code == 200

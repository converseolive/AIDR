import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_idor_list_chats(client):
    # Clear existing chats for clean slate
    chat_sessions.clear()

    # User A creates a chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_a"
    resp = client.post("/api/chats")
    chat_id = resp.json["id"]

    # User B lists chats
    with client.session_transaction() as sess:
        sess["session_id"] = "user_b"
    resp = client.get("/api/chats")
    chats = resp.json["chats"]

    assert len(chats) == 0

def test_idor_get_chat(client):
    # Clear existing chats for clean slate
    chat_sessions.clear()

    # User A creates a chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_a"
    resp = client.post("/api/chats")
    chat_id = resp.json["id"]

    # User B tries to get chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_b"
    resp = client.get(f"/api/chats/{chat_id}")

    assert resp.status_code == 404

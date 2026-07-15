import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.secret_key = "test"
    with app.test_client() as client:
        yield client

def test_idor(client):
    # User A creates a chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_a"

    res = client.post("/api/chats")
    chat_id = res.json["id"]

    # User B tries to get it
    with client.session_transaction() as sess:
        sess["session_id"] = "user_b"

    res = client.get(f"/api/chats/{chat_id}")
    assert res.status_code == 404, "IDOR: User B can read User A's chat"

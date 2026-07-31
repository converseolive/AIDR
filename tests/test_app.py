import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.secret_key = "test-secret"
    with app.test_client() as client:
        yield client

def test_idor_protection(client):
    """Test that users can only access their own chats."""
    # Create chat as User A
    with client.session_transaction() as sess:
        sess["session_id"] = "user-a"

    res = client.post("/api/chats")
    assert res.status_code == 200
    chat_id = res.json["id"]

    assert chat_sessions[chat_id]["user_id"] == "user-a"

    # User A can get the chat
    res = client.get(f"/api/chats/{chat_id}")
    assert res.status_code == 200

    # Switch to User B
    with client.session_transaction() as sess:
        sess["session_id"] = "user-b"

    # User B cannot get User A's chat
    res = client.get(f"/api/chats/{chat_id}")
    assert res.status_code == 404

    # User B cannot rename User A's chat
    res = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked"})
    assert res.status_code == 404

    # User B cannot delete User A's chat
    res = client.delete(f"/api/chats/{chat_id}")
    assert res.status_code == 404

    # User B cannot list User A's chat
    res = client.get("/api/chats")
    assert res.status_code == 200
    assert len(res.json["chats"]) == 0

    # Cleanup (ensure it's still there)
    assert chat_id in chat_sessions

    # User A can delete the chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user-a"
    res = client.delete(f"/api/chats/{chat_id}")
    assert res.status_code == 200
    assert chat_id not in chat_sessions

def test_global_session_init(client):
    """Test that session_id is initialized even if the root route isn't hit."""
    res = client.get("/api/settings")
    assert res.status_code == 200

    with client.session_transaction() as sess:
        assert "session_id" in sess

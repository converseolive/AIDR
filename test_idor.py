import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as client:
        yield client

def test_idor_protection(client):
    # Clear any existing sessions
    chat_sessions.clear()

    # 1. Create a chat as User A
    with client.session_transaction() as sess:
        sess["session_id"] = "user_a"
        sess["provider"] = "ollama"

    resp = client.post("/api/chats")
    assert resp.status_code == 200
    chat_id = resp.json["id"]

    assert chat_sessions[chat_id]["user_id"] == "user_a"

    # 2. Try to access it as User B
    with client.session_transaction() as sess:
        sess["session_id"] = "user_b"
        sess["provider"] = "ollama"

    # get_chat should return 403
    resp = client.get(f"/api/chats/{chat_id}")
    assert resp.status_code == 403

    # delete_chat should return 403
    resp = client.delete(f"/api/chats/{chat_id}")
    assert resp.status_code == 403

    # rename_chat should return 403
    resp = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked Title"})
    assert resp.status_code == 403

    # chat should return 403
    resp = client.post("/api/chat", json={"message": "hello", "chat_id": chat_id, "aidr_enabled": "false"})
    assert resp.status_code == 403

    # list_chats should not show User A's chat
    resp = client.get("/api/chats")
    assert resp.status_code == 200
    assert len(resp.json["chats"]) == 0

    # 3. Access it as User A
    with client.session_transaction() as sess:
        sess["session_id"] = "user_a"
        sess["provider"] = "ollama"

    # list_chats should show it
    resp = client.get("/api/chats")
    assert resp.status_code == 200
    assert len(resp.json["chats"]) == 1

    # get_chat should work
    resp = client.get(f"/api/chats/{chat_id}")
    assert resp.status_code == 200

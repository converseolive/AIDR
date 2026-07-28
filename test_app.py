import pytest
import uuid
import json
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.secret_key = "test_secret_key"
    with app.test_client() as client:
        yield client

def test_idor_chat_isolation(client):
    """Test that users cannot access or modify each other's chats."""

    # 1. Simulate User A creating a chat
    user_a_id = str(uuid.uuid4())
    with client.session_transaction() as sess:
        sess["session_id"] = user_a_id

    response_a = client.post("/api/chats")
    assert response_a.status_code == 200
    chat_a_id = response_a.json["id"]

    # Verify chat was created and belongs to User A
    assert chat_sessions[chat_a_id]["user_id"] == user_a_id

    # 2. Simulate User B trying to access User A's chat
    user_b_id = str(uuid.uuid4())
    with client.session_transaction() as sess:
        sess["session_id"] = user_b_id
        sess["provider"] = "ollama"

    # Try to GET User A's chat
    response_b_get = client.get(f"/api/chats/{chat_a_id}")
    assert response_b_get.status_code == 403
    assert response_b_get.json["error"] == "Unauthorized"

    # Try to RENAME User A's chat
    response_b_rename = client.post(f"/api/chats/{chat_a_id}/rename", json={"title": "Hacked Title"})
    assert response_b_rename.status_code == 403
    assert response_b_rename.json["error"] == "Unauthorized"

    # Verify title didn't change
    assert chat_sessions[chat_a_id]["title"] == "New Chat"

    # Try to DELETE User A's chat
    response_b_delete = client.delete(f"/api/chats/{chat_a_id}")
    assert response_b_delete.status_code == 403
    assert response_b_delete.json["error"] == "Unauthorized"

    # Verify chat still exists
    assert chat_a_id in chat_sessions

    # Try to LIST chats as User B and verify User A's chat is NOT there
    response_b_list = client.get("/api/chats")
    assert response_b_list.status_code == 200
    chat_ids = [c["id"] for c in response_b_list.json["chats"]]
    assert chat_a_id not in chat_ids

    # Try to APPEND MESSAGE to User A's chat via POST /api/chat
    response_b_chat = client.post(
        "/api/chat",
        json={"message": "Hack", "chat_id": chat_a_id, "aidr_enabled": False}
    )
    assert response_b_chat.status_code == 403
    assert response_b_chat.json["error"] == "Unauthorized"

    # 3. Simulate User A accessing their own chat successfully
    with client.session_transaction() as sess:
        sess["session_id"] = user_a_id

    response_a_get = client.get(f"/api/chats/{chat_a_id}")
    assert response_a_get.status_code == 200
    assert response_a_get.json["id"] == chat_a_id

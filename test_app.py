import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_idor_protection(client):
    # Setup mock sessions and initial data
    chat_sessions.clear()

    # User 1 creates a chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user-1"
        sess["provider"] = "ollama"
        sess["api_key"] = "mock_key"
    response = client.post("/api/chats")
    assert response.status_code == 200
    chat_id = response.json["id"]

    # User 2 tries to access User 1's chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user-2"
        sess["provider"] = "ollama"
        sess["api_key"] = "mock_key"

    # Test get_chat
    resp_get = client.get(f"/api/chats/{chat_id}")
    assert resp_get.status_code == 403

    # Test rename_chat
    resp_rename = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked"})
    assert resp_rename.status_code == 403

    # Test delete_chat
    resp_delete = client.delete(f"/api/chats/{chat_id}")
    assert resp_delete.status_code == 403

    # Test main chat
    resp_chat = client.post(
        "/api/chat",
        json={"message": "hello", "chat_id": chat_id, "aidr_enabled": "false"}
    )
    assert resp_chat.status_code == 403

    # Test list_chats (should not see User 1's chat)
    resp_list = client.get("/api/chats")
    assert response.status_code == 200
    assert len(resp_list.json["chats"]) == 0

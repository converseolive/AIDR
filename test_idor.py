import pytest
import uuid
import json
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client

def test_idor_protection(client):
    user_a_session_id = str(uuid.uuid4())
    user_b_session_id = str(uuid.uuid4())

    # 1. User A creates a chat
    chat_id = None
    with client.session_transaction() as sess:
        sess["session_id"] = user_a_session_id

    response = client.post("/api/chats")
    assert response.status_code == 200
    data = json.loads(response.data)
    chat_id = data["id"]

    assert chat_sessions[chat_id]["user_id"] == user_a_session_id

    # User A can list it
    response = client.get("/api/chats")
    data = json.loads(response.data)
    assert len(data["chats"]) > 0
    assert any(c["id"] == chat_id for c in data["chats"])

    # Switch to User B
    with client.session_transaction() as sess:
        sess["session_id"] = user_b_session_id

    # 2. User B cannot list it
    response = client.get("/api/chats")
    data = json.loads(response.data)
    assert not any(c["id"] == chat_id for c in data["chats"])

    # 3. User B cannot access it
    response = client.get(f"/api/chats/{chat_id}")
    assert response.status_code == 403

    # 4. User B cannot rename it
    response = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked"})
    assert response.status_code == 403

    # 5. User B cannot delete it
    response = client.delete(f"/api/chats/{chat_id}")
    assert response.status_code == 403

    # 6. User B cannot chat in it
    # We'll use ollama provider to avoid API key requirements in test
    with client.session_transaction() as sess:
        sess["provider"] = "ollama"
        sess["session_id"] = user_b_session_id

    response = client.post("/api/chat", json={
        "chat_id": chat_id,
        "message": "Hello",
        "aidr_enabled": False
    })
    assert response.status_code == 403

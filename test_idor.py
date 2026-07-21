import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_idor_vulnerability(client):
    # Setup dummy chat owned by victim
    chat_sessions["victim_chat"] = {
        "id": "victim_chat",
        "title": "Victim's Secrets",
        "messages": [{"role": "user", "content": "secret"}],
        "user_id": "victim_session_id"
    }

    with client.session_transaction() as sess:
        sess["session_id"] = "attacker_session_id"
        sess["provider"] = "ollama"  # avoids the API key validation returning 400

    # Attacker tries to read victim's chat
    resp = client.get("/api/chats/victim_chat")
    assert resp.status_code == 403

    # Attacker tries to delete victim's chat
    resp = client.delete("/api/chats/victim_chat")
    assert resp.status_code == 403

    # Attacker tries to rename victim's chat
    resp = client.post("/api/chats/victim_chat/rename", json={"title": "Hacked"})
    assert resp.status_code == 403

    # Attacker tries to use victim's chat via main chat endpoint
    resp = client.post("/api/chat", json={"chat_id": "victim_chat", "message": "hello"})
    assert resp.status_code == 403

    # Ensure list_chats does not leak victim's chat to attacker
    resp = client.get("/api/chats")
    assert resp.status_code == 200
    assert not any(c["id"] == "victim_chat" for c in resp.get_json()["chats"])

if __name__ == "__main__":
    pytest.main(["-v", "test_idor.py"])

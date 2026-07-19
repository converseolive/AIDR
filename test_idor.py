import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client

def test_idor_list_chats(client):
    chat_sessions.clear()

    with client.session_transaction() as sess:
        sess["session_id"] = "user1"

    res = client.post("/api/chats")
    assert res.status_code == 200

    with client.session_transaction() as sess:
        sess["session_id"] = "user2"

    res = client.get("/api/chats")
    chats = res.json["chats"]
    assert len(chats) == 0

def test_idor_get_chat(client):
    chat_sessions.clear()

    with client.session_transaction() as sess:
        sess["session_id"] = "user1"

    res = client.post("/api/chats")
    assert res.status_code == 200
    chat_id = res.json["id"]

    with client.session_transaction() as sess:
        sess["session_id"] = "user2"

    res = client.get(f"/api/chats/{chat_id}")
    assert res.status_code == 403

def test_idor_delete_chat(client):
    chat_sessions.clear()

    with client.session_transaction() as sess:
        sess["session_id"] = "user1"

    res = client.post("/api/chats")
    chat_id = res.json["id"]

    with client.session_transaction() as sess:
        sess["session_id"] = "user2"

    res = client.delete(f"/api/chats/{chat_id}")
    assert res.status_code == 403

def test_idor_rename_chat(client):
    chat_sessions.clear()

    with client.session_transaction() as sess:
        sess["session_id"] = "user1"

    res = client.post("/api/chats")
    chat_id = res.json["id"]

    with client.session_transaction() as sess:
        sess["session_id"] = "user2"

    res = client.post(f"/api/chats/{chat_id}/rename", json={"title": "New Title"})
    assert res.status_code == 403

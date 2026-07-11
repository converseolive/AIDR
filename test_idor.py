import pytest
from app import app, chat_sessions

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_idor_protection(client):
    # Setup test chat sessions explicitly
    chat_sessions.clear()

    # 1. First user creates a chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_A_session"

    resp_create = client.post("/api/chats")
    assert resp_create.status_code == 200
    chat_id = resp_create.json["id"]

    # 2. First user can access the chat
    resp_get = client.get(f"/api/chats/{chat_id}")
    assert resp_get.status_code == 200

    # 3. Second user tries to access first user's chat
    with client.session_transaction() as sess:
        sess["session_id"] = "user_B_session"

    resp_get_unauth = client.get(f"/api/chats/{chat_id}")
    assert resp_get_unauth.status_code == 403

    resp_rename_unauth = client.post(f"/api/chats/{chat_id}/rename", json={"title": "Hacked"})
    assert resp_rename_unauth.status_code == 403

    resp_del_unauth = client.delete(f"/api/chats/{chat_id}")
    assert resp_del_unauth.status_code == 403

    # Test the list_chats endpoint filters correctly
    resp_list = client.get("/api/chats")
    assert resp_list.status_code == 200
    assert len(resp_list.json["chats"]) == 0  # User B shouldn't see User A's chat

    # Second user creates a chat
    client.post("/api/chats")
    resp_list2 = client.get("/api/chats")
    assert resp_list2.status_code == 200
    assert len(resp_list2.json["chats"]) == 1 # User B should see exactly their 1 chat

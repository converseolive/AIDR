import requests
import json
import uuid

# Base URL
url = "http://localhost:5000"

def test_idor():
    # User A creates a chat
    sess_a = requests.Session()
    # first hit / to get a session_id
    sess_a.get(f"{url}/")

    res = sess_a.post(f"{url}/api/chats")
    chat_id = res.json()["id"]
    print(f"User A created chat: {chat_id}")

    # User B tries to read the chat
    sess_b = requests.Session()
    sess_b.get(f"{url}/")

    res = sess_b.get(f"{url}/api/chats/{chat_id}")
    if res.status_code == 200:
        print("VULNERABLE: User B can read User A's chat!")
    else:
        print("SECURE: User B cannot read User A's chat.")

if __name__ == "__main__":
    test_idor()

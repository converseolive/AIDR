## 2026-07-09 - [Insecure Direct Object Reference (IDOR) in Chat API]
**Vulnerability:** The chat API endpoints (`get_chat`, `delete_chat`, `rename_chat`, `chat` loop, `clear_chat`, and `list_chats`) did not restrict access based on the user's `session_id`. Any user could potentially read, modify, or delete another user's chat session if they knew or guessed the `chat_id`.
**Learning:** The application was missing an overarching identity and ownership model. `session_id` was only being generated in the `index()` route, meaning direct API access might not even have a `session_id`, and there was no verification of ownership during CRUD operations on chat sessions.
**Prevention:**
1. Use `@app.before_request` to globally ensure a `session_id` exists for every request.
2. When creating objects, explicitly store the `session_id` of the creator (`"session_id": session.get("session_id")`).
3. For all retrieval, modification, or deletion operations, explicitly verify that the object's `session_id` matches the requester's `session_id`.

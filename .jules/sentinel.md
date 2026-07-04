## 2024-07-04 - [CRITICAL] Prevent Insecure Direct Object Reference (IDOR) on Chat API

**Vulnerability:** The chat API endpoints (`/api/chats`, `/api/chats/<id>`, `/api/chats/<id>/rename`, `/api/chats/<id> (DELETE)`, and the `chat()` message creation logic) lacked authorization checks. While chat sessions generate unique UUIDs, any user possessing a `chat_id` could read, rename, or delete the chat belonging to another user, or append messages to it. Furthermore, `list_chats` dumped metadata for *all* users' chats globally.

**Learning:** When using globally scoped dictionaries or databases for object storage, authentication (having a valid session) does not automatically confer authorization (owning the specific object). UUIDs are an insufficient security mechanism to prevent unauthorized access since they can leak or be brute-forced (though difficult), and global listing completely bypasses this obscurity.

**Prevention:** Always scope resource queries and mutations to the currently authenticated user's identity. Here, we enforced this by recording the `session_id` into the `chat_sessions` dict upon creation and enforcing `chat_session.get("session_id") == session.get("session_id")` across all read, update, list, and delete operations.

## 2025-07-05 - Missing IDOR checks on chat endpoints
**Vulnerability:** Any user could access, rename, clear, or delete chats by guessing the `chat_id`.
**Learning:** `chat_sessions` was stored globally by `chat_id` and endpoints only checked if `chat_id` existed, lacking ownership verification against the current user's session.
**Prevention:** Always track `session_id` on stateful objects, and always verify that `obj["session_id"] == session.get("session_id")` before performing any read or write operations.

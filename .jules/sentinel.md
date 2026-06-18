## 2025-05-14 - Fix IDOR in Chat API
**Vulnerability:** The chat endpoints (`list_chats`, `get_chat`, `delete_chat`, `rename_chat`, `clear_chat`) had a critical IDOR vulnerability allowing any user to manage other users' chats, as they did not check ownership.
**Learning:** We need to ensure that every chat resource accessed or modified binds to a session identity (`session_id`), and that APIs filter logic or block requests containing an unmatching `session_id`.
**Prevention:** Check for `owner == session.get("session_id")` or a similar identity verifier during access and manipulation, return `403` Unauthorized.

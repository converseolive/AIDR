## 2025-06-27 - IDOR in Global State Chat Storage
**Vulnerability:** Insecure Direct Object Reference (IDOR) on chat sessions. The `chat_sessions` dictionary mapped `chat_id`s to sessions, and anyone could access, read, delete, or append to any chat simply by providing its UUID without ownership verification.
**Learning:** Storing application state globally (e.g. `chat_sessions = {}`) inherently bypasses per-user scoping provided by Flask sessions unless ownership attributes are explicitly added and verified.
**Prevention:** Every stateful object created by a user must store a reference to their identity (e.g., `session_id`). All routes accessing or mutating those objects must explicitly verify `object.owner_id == current_user.id`.

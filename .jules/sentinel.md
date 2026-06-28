## 2026-06-28 - [IDOR in Chat Endpoints]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on all chat endpoints (`/api/chats/<chat_id>`). Any user could read, delete, or rename any other user's chat session if they knew the `chat_id`.
**Learning:** The application lacked an authorization layer. While a `session_id` existed, it was only initialized on the `/` route and wasn't bound to chat objects upon creation, making ownership checks impossible.
**Prevention:** 1) Globally initialize user sessions in an `@app.before_request` hook. 2) Store the creator's `session_id` inside the resource object. 3) Enforce an explicit ownership check (`if chat['session_id'] != current_session_id: return 403`) before processing any CRUD operations.

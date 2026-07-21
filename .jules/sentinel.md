## 2025-02-14 - Fix IDOR in Chat APIs
**Vulnerability:** The chat APIs (`/api/chats`, `/api/chat`, etc) allowed any user to access, rename, or delete any chat session if they knew or guessed the `chat_id`, as the API did not verify the session ownership against the `user_id`. Also, `list_chats` exposed all chats to all users.
**Learning:** Initializing the tracking `session_id` only in the `index()` route allows authorization bypass for direct API requests.
**Prevention:** Global user identity (like `session_id`) should be initialized in a `@app.before_request` hook. All endpoints handling state must verify the identity against the target resource's owner before acting.

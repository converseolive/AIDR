## 2024-07-31 - IDOR in Flask Chat Application
**Vulnerability:** Insecure Direct Object Reference (IDOR) on all chat CRUD endpoints (`/api/chats`, `/api/chats/<id>`, etc.). Chat metadata lacked ownership bindings.
**Learning:** `session_id` was being lazy-loaded only in the root `/` route. Direct API access bypassed session initialization entirely. Chat objects did not associate a session with ownership, allowing global reads/mutations.
**Prevention:** Globalize session initialization using Flask's `@app.before_request`. Explicitly save the creating user's identifier on the object and assert equality on all read/write endpoints.

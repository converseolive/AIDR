## 2025-05-14 - IDOR Vulnerability via Missing Session Checks

**Vulnerability:**
The application had an Insecure Direct Object Reference (IDOR) vulnerability. Chat sessions were created and tracked by an arbitrary client-side `session_id`, but the backend did not enforce ownership checks when accessing, renaming, deleting, listing, or appending messages to chats. Any user could guess or predict a `chat_id` and gain unauthorized read/write access to another user's chat session.

**Learning:**
Relying solely on unpredictable resource IDs (like UUIDs) for security is insufficient (Security by Obscurity). The backend must always verify that the requester is authorized to access the requested resource. Furthermore, relying on individual routes to initialize state (e.g., in `index()`) can lead to authorization bypasses on direct API hits.

**Prevention:**
1. Explicitly tie resources to the entity that created them upon creation (e.g., adding `user_id` to the chat object).
2. Enforce strict ownership validation in all routes interacting with the resource (`if chat["user_id"] != current_user: return 403`).
3. Handle session initialization globally via an `@app.before_request` hook, rather than piecemeal in specific route handlers, ensuring all API interactions have a valid identity context.
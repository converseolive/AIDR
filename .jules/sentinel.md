## 2023-10-27 - [Authorization Bypass / IDOR in Chat Endpoints]
**Vulnerability:** The chat API lacked ownership verification (`user_id`). Furthermore, `session_id` was only initialized when a user visited the `index()` route `/`.
**Learning:** If a client directly called an API endpoint without hitting the index, their `session_id` would be `None`. If other entities also had uninitialized `user_id`s, this could lead to unintended overlaps or logic bypasses.
**Prevention:** Initialize `session_id` globally using a `@app.before_request` hook so it's guaranteed on every request. Always tie stateful resources to a `user_id` and check `user_id == session["session_id"]` on every read, update, or delete operation.

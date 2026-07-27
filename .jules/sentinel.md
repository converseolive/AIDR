## 2026-07-27 - IDOR in Chat Operations via Unverified Session IDs

**Vulnerability:**
The application initialized `session_id` only in the specific route handler (`index()`), leaving direct API calls without an assigned `session_id` (evaluating to `None`). Also, `session_id` was not saved as `user_id` when chats were created, and none of the API operations (`list_chats`, `get_chat`, `delete_chat`, `rename_chat`, `chat`) verified ownership. Thus, any unauthenticated or authenticated user could access and manipulate any chat.

**Learning:**
When tracking user identity using session variables, initialize the identifier using a `@app.before_request` hook so that it's universally available for every request. Always tie state-mutating and data-retrieval objects to a `user_id` and explicitly verify ownership on every action (Insecure Direct Object Reference (IDOR) prevention).

**Prevention:**
Enforce global identity initialization for session tracking using lifecycle hooks (`@app.before_request`) rather than individual route handlers. Consistently track object ownership (`user_id`) upon creation and validate ownership against the current session identity before returning data or applying changes in every endpoint touching that object.

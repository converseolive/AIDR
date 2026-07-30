## 2026-07-30 - [IDOR in Chat API via Uninitialized Flask Session]
**Vulnerability:** Uninitialized session_id in API endpoints led to Auth Bypass and IDOR (Insecure Direct Object Reference) because the ID relied on the UI index route.
**Learning:** When tracking user identity in Flask using session variables, initialize the identifier globally (e.g., `@app.before_request`) rather than within specific route handlers (like `index()`) to prevent authorization bypasses where uninitialized sessions evaluate to `None` on direct API access.
**Prevention:** Initialize identity globally, store user identifiers inside created objects, and enforce authorization checks by verifying the object's user ID matches the current session ID in all state-mutating and data-retrieval endpoints.

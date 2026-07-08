## 2026-07-08 - [Flask App Context Authentication Bypass]
**Vulnerability:** IDOR due to `session_id` being initialized only in the `index()` route, allowing bypasses on direct API access, combined with missing ownership checks in chat CRUD endpoints.
**Learning:** Relying on a specific view (like `index()`) to initialize authentication state allows attackers to bypass initialization by calling API endpoints directly, leaving the authentication state as `None` or missing.
**Prevention:** Always initialize core authentication or identification state globally using mechanisms like `@app.before_request`, and enforce explicit ownership checks comparing the resource owner against the global user identity in all API endpoints.

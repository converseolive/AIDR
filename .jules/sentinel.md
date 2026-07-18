## 2024-05-16 - Prevent Authorization Bypass / IDOR in Chat API
**Vulnerability:** Insecure Direct Object Reference (IDOR).
**Learning:** Endpoints that modify and retrieve user specific resources (like active chats) missed validating that the entity accessing them was their rightful owner. `session_id` was also mistakenly initialized in the root route rather than checking globally for the session context, opening an authorization bypass for direct API requests.
**Prevention:** Initialize identities via `@app.before_request`. Add ownership checks (e.g. `s.get("session_id") != session.get("session_id")`) across all mutating API routes.

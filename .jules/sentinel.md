
## 2024-05-24 - [IDOR in Chat Session Management]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where users could read, modify, and delete other users' chat sessions via unauthenticated/unauthorized API requests.
**Learning:** Initializing session identifiers in specific route handlers (e.g., `index()`) allows direct API access without a session ID. Lack of authorization checks on object access enables IDOR.
**Prevention:** Initialize global user identifiers in a `@app.before_request` hook. Always verify object ownership against the current user's authenticated session for all state-mutating and data-retrieval endpoints.

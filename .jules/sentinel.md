## 2026-07-19 - [CRITICAL] Fix IDOR in chat sessions
**Vulnerability:** Insecure Direct Object Reference (IDOR) on chat operations.
**Learning:** Chat sessions were referenced globally by ID without checking if the current user owned them.
**Prevention:** Always verify the active session ID matches the owner of the requested object for any state-mutating or data-retrieval API operations.

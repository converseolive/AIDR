## 2025-06-29 - IDOR Vulnerability in Chat Session Endpoints
**Vulnerability:** Insecure Direct Object Reference (IDOR) on chat session endpoints. The API allowed any user to view, rename, clear, or delete chat sessions belonging to other users simply by providing the `chat_id`. The application did not verify that the requester was the creator of the chat session.
**Learning:** `session_id` was being assigned to users upon loading the frontend (`index()`), but it was not systematically associated with resources they created, nor was it checked when they attempted to access or modify those resources. User identity (`session_id`) must be consistently applied and verified across all API endpoints that handle user-specific data.
**Prevention:**
1. Use an `@app.before_request` hook to ensure a `session_id` is initialized globally for every incoming request.
2. When creating a new resource (like a chat session), always store the creator's `session_id` on the resource object.
3. On any read/write/delete operations for a resource, explicitly verify that the requester's `session_id` matches the resource's `session_id`.

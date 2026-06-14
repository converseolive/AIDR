## 2024-05-30 - IDOR in In-Memory Chat Sessions
**Vulnerability:** Chat sessions were accessible via UUIDs without checking if the user requesting them was the creator.
**Learning:** Even with an ephemeral/in-memory datastore and UUIDs for identification, explicit authorization checks mapping entities to a session token are necessary to prevent IDOR.
**Prevention:** Ensure all stateful entities generated or managed by the server have an owner ID (`session_id`) and verify this ID on all read, update, and delete actions.

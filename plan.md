1. **Move Session Initialization**: Move `session_id` initialization to an `@app.before_request` hook to prevent authorization bypass and uninitialized session issues.
2. **Associate Chats with Users**: Update the chat creation logic in `/api/chats` (POST) and `/api/chat` (POST) to save `session["session_id"]` into the chat metadata.
3. **Verify Ownership**: Update `list_chats`, `get_chat`, `delete_chat`, `rename_chat`, and `chat` endpoints to verify that the chat's `session_id` matches the current `session["session_id"]`.
4. **Pre Commit Steps**: Complete pre commit steps.
5. **Submit**: Create PR for the fix.

## 2024-05-24 - [Flask App Secret Key Hardcoded Fallback]
**Vulnerability:** Found a hardcoded string ("dev-secret-key-change-me") being used as a fallback for `app.secret_key` when the `FLASK_SECRET_KEY` environment variable was not set.
**Learning:** Hardcoded secret keys in open-source or shared repositories are critical vulnerabilities. An attacker who knows the secret key can forge session cookies and impersonate users, especially if session management relies on these cookies for authorization. Even if it's meant for local development, it can easily leak into production.
**Prevention:** Always generate a secure, random fallback (e.g., using `secrets.token_hex(32)`) or fail to start if a critical secret is missing. Never hardcode secrets directly in the source code.

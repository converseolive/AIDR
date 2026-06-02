## 2026-06-02 - [CRITICAL] Fixed Hardcoded Flask Secret Key

**Vulnerability:** The application used a hardcoded Flask secret key (`"dev-secret-key-change-me"`) as a fallback if `FLASK_SECRET_KEY` was not set in the environment variables. Because Flask sessions are cryptographically signed using this key (and in this app, session contents like API keys are stored client-side), an attacker knowing the default key could forge session cookies to impersonate users, hijack sessions, and potentially extract stored API keys or escalate privileges.

**Learning:** Default, hardcoded secrets are extremely dangerous, especially for web frameworks that rely on them for session integrity. Even as a fallback for local development, they pose a significant risk if the code is deployed to production without proper configuration.

**Prevention:** Ensure that fallback secret keys are cryptographically secure and generated at runtime (e.g., using `os.urandom(24).hex()`). This prevents attackers from knowing or guessing the key, even if the environment variable is missing. It's better for sessions to invalidate on server restart than to be permanently vulnerable.

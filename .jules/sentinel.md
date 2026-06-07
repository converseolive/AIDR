## 2024-06-07 - [CRITICAL] Fix Hardcoded Flask Secret Key
**Vulnerability:** A hardcoded Flask secret key (`"dev-secret-key-change-me"`) was found in `app.py`. This is critical as it allows an attacker to forge session cookies and impersonate any user or bypass authentication.
**Learning:** Hardcoded fallbacks in configuration functions for secrets often get deployed to production inadvertently, posing a severe security risk. This app's architecture relies heavily on the session object to store API keys and tokens.
**Prevention:** Always use a secure random generator for fallbacks (`secrets.token_hex(32)`) or enforce setting the environment variable, preventing the app from starting if it's missing. Never commit default placeholder passwords or secret keys directly in the codebase.

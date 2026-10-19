## 2024-06-04 - Hardcoded Flask Secret Key
**Vulnerability:** Found a hardcoded, default fallback value ("dev-secret-key-change-me") for `app.secret_key` in `app.py`. This is a critical security risk as it could allow an attacker to forge session cookies or tamper with data if the environment variable `FLASK_SECRET_KEY` is not set.
**Learning:** Hardcoded default secrets are a common oversight during development that often persist into production environments.
**Prevention:** Always use a secure, dynamically generated random string as a fallback when an environment variable secret is missing (e.g., `os.getenv("SECRET_KEY") or secrets.token_hex(32)`).

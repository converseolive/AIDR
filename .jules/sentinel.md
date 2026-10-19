## 2024-05-24 - Hardcoded Flask Secret Key
**Vulnerability:** A hardcoded `FLASK_SECRET_KEY` ("dev-secret-key-change-me") was found in `app.py`.
**Learning:** Using a hardcoded secret key for a Flask application allows an attacker to forge session cookies, which could lead to authentication bypass or session hijacking, especially if the app is exposed or not configured correctly in production.
**Prevention:** Always use a randomly generated fallback secret (e.g., `import secrets; secrets.token_hex(32)`) if an environment variable is not provided, so each instance has a unique, strong, and unpredictable secret by default.

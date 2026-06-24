## 2025-06-10 - [Hardcoded Flask Secret Key]
**Vulnerability:** The application used a hardcoded fallback secret key (`"dev-secret-key-change-me"`) for Flask's `app.secret_key` when the `FLASK_SECRET_KEY` environment variable was missing.
**Learning:** Hardcoded secret keys allow attackers to forge session cookies, which can lead to session hijacking and potentially Server-Side Request Forgery (SSRF) if session settings (like `ollama_url`) are manipulated.
**Prevention:** Always use securely generated random keys (e.g., `os.urandom(24).hex()`) as a fallback for missing secret configuration, and warn administrators that sessions will not persist across restarts until a permanent key is configured.

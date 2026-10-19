## 2024-06-09 - Hardcoded Flask Secret Key
**Vulnerability:** Found a hardcoded, static fallback secret key (`"dev-secret-key-change-me"`) for the Flask app's session token.
**Learning:** Hardcoded fallback keys completely compromise user sessions if the environment variable isn't set, as any attacker knowing the codebase could easily sign forged session cookies. The vulnerability existed because it's a common convenience pattern during development.
**Prevention:** Use `os.urandom(24)` or a similar securely generated random fallback to ensure every local session uses a unique, unpredictable secret when a static environment variable is not explicitly provided.

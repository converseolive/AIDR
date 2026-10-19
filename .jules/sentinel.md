## 2024-06-17 - SSRF in AI Config URLs
**Vulnerability:** Server-Side Request Forgery (SSRF) via user-configurable `ollama_url` and `AIDR_BASE_URL` inputs, allowing attackers to force the server to issue HTTP requests to internal/metadata endpoints (e.g., 169.254.169.254).
**Learning:** Configurations allowing users to specify arbitrary URLs for backend services (like self-hosted LLM endpoints or custom API bases) introduce significant SSRF risks if the URLs are not validated before the server accesses them.
**Prevention:** Implement strict URL validation for all user-provided endpoints, verifying the scheme (http/https), resolving the hostname to an IP address, and rejecting any loopback, link-local, or multicast IPs (except for necessary local dev exceptions like localhost).

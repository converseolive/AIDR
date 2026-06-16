
## 2024-06-16 - SSRF Vulnerability in User Configurable Providers
**Vulnerability:** The application allowed users to specify a custom `ollama_url` which was then used in outbound requests without validation.
**Learning:** Configurable endpoints can be used to execute Server-Side Request Forgery (SSRF) attacks against internal metadata services.
**Prevention:** All user-supplied URLs must be strictly validated. The validation should parse the URL, verify the scheme, resolve the hostname to an IP, and explicitly reject restricted IP ranges like the `169.254.x.x` link-local block used by cloud metadata APIs.

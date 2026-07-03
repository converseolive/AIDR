## 2024-07-04 - SSRF in User-Configurable URLs
**Vulnerability:** Server-Side Request Forgery (SSRF) vulnerabilities found in user-configurable URLs: `AIDR_BASE_URL` (for Crowdstrike AIDR configuration) and `ollama_url` (for the local Ollama LLM setup). The application allowed arbitrary hostnames and IP addresses without sufficient validation.
**Learning:** SSRF mitigation is complex. Using a simple regex or string match is insufficient. It is crucial to check the resolved IP addresses to prevent bypasses like `0.0.0.0` (unspecified address) which bypasses standard `is_private` or `is_loopback` checks but can still route to localhost on many systems. Also, DNS resolution needs proper timeouts using localized approaches (like ThreadPoolExecutor) rather than global socket timeouts to avoid thread leaks. Lastly, while `socket.getaddrinfo` validates the initial IP, fully mitigating DNS Rebinding (TOCTOU) requires a custom HTTP adapter to ensure the HTTP client uses the exact same IP that was validated.
**Prevention:** Implement a robust `is_safe_url` validator that:
1. Validates the scheme (strictly http/https).
2. Resolves the hostname to IP addresses with a safe, bounded timeout.
3. Explicitly blocks `is_multicast`, `is_unspecified` (0.0.0.0/::), and `is_link_local` addresses.
4. Conditionally blocks `is_private` and `is_loopback` depending on whether the feature legally requires local network access (like Ollama).

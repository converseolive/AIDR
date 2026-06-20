## 2024-06-20 - SSRF and DNS Resolution Timeout DoS in URL Validation

**Vulnerability:**
The application accepted user-provided URLs (`AIDR_BASE_URL` and `ollama_url`) without adequate validation, leading to Server-Side Request Forgery (SSRF) risks. Furthermore, if a naive URL validation attempt was implemented using a standard socket timeout or a `with ThreadPoolExecutor` block, it could lead to Denial of Service (DoS) due to DNS resolution blocking or context managers waiting indefinitely on timeout threads.

**Learning:**
DNS resolution issues require special handling in Python. A typical timeout mechanism may still block the thread when using context managers. Validation must differentiate between internal tools that legitimately need access to local IPs (like Ollama) and external services (like AIDR) that should strictly be blocked from accessing private or loopback addresses.

**Prevention:**
Always validate user-provided URLs. Use `urllib.parse` to restrict schemes. Resolve hostnames using `ThreadPoolExecutor` and handle timeouts manually by calling `executor.shutdown(wait=False, cancel_futures=True)` to prevent DoS. Block metadata and multicast IPs globally, and restrict private/loopback IPs depending on the context of the URL via flags.

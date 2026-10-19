import pytest
from app import is_safe_url
import socket

def test_safe_urls():
    # Valid external URLs
    assert is_safe_url("https://api.us-2.crowdstrike.com/aidr/aiguard", allow_local=False) == True
    assert is_safe_url("http://example.com", allow_local=False) == True

def test_invalid_scheme():
    # Invalid schemes
    assert is_safe_url("ftp://example.com", allow_local=False) == False
    assert is_safe_url("file:///etc/passwd", allow_local=False) == False
    assert is_safe_url("gopher://example.com", allow_local=False) == False

def test_allow_local_flag():
    # Local IPs
    assert is_safe_url("http://127.0.0.1:11434", allow_local=False) == False
    assert is_safe_url("http://127.0.0.1:11434", allow_local=True) == True

    # Private IPs
    assert is_safe_url("http://192.168.1.1", allow_local=False) == False
    assert is_safe_url("http://192.168.1.1", allow_local=True) == True
    assert is_safe_url("http://10.0.0.1", allow_local=False) == False
    assert is_safe_url("http://10.0.0.1", allow_local=True) == True

def test_unspecified_multicast_link_local():
    # These should be blocked regardless of allow_local
    assert is_safe_url("http://0.0.0.0", allow_local=True) == False
    assert is_safe_url("http://0.0.0.0", allow_local=False) == False

    # Metadata IP (Link-local)
    assert is_safe_url("http://169.254.169.254", allow_local=True) == False
    assert is_safe_url("http://169.254.169.254", allow_local=False) == False

    # Multicast
    assert is_safe_url("http://224.0.0.1", allow_local=True) == False
    assert is_safe_url("http://224.0.0.1", allow_local=False) == False

def test_empty_url():
    # Empty URL is allowed as it might be optional
    assert is_safe_url("", allow_local=False) == True
    assert is_safe_url(None, allow_local=False) == True

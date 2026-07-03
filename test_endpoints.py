from app import is_safe_url

def test_is_safe_url():
    assert is_safe_url("http://google.com", False) == True
    assert is_safe_url("http://localhost:11434", True) == True
    assert is_safe_url("http://localhost:11434", False) == False
    assert is_safe_url("http://127.0.0.1", True) == True
    assert is_safe_url("http://127.0.0.1", False) == False
    assert is_safe_url("http://169.254.169.254", True) == False
    assert is_safe_url("http://0.0.0.0", True) == False
    assert is_safe_url("file:///etc/passwd", True) == False

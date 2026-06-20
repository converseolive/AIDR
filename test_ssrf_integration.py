import pytest
from app import app, is_safe_url

def test_is_safe_url():
    assert is_safe_url("") == True
    assert is_safe_url("https://google.com") == True
    assert is_safe_url("http://localhost:11434") == False
    assert is_safe_url("http://localhost:11434", allow_local=True) == True
    assert is_safe_url("http://169.254.169.254") == False
    assert is_safe_url("http://169.254.169.254", allow_local=True) == False

if __name__ == "__main__":
    test_is_safe_url()
    print("OK")

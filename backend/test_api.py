import requests
import json

# Test the prompts endpoints directly
base_url = "http://localhost:5000/api"

def test_add_prompt():
    print("Testing add prompt endpoint...")
    
    data = {
        "title": "Direct API Test",
        "description": "Testing via direct API call",
        "type": "speaking",
        "difficulty": "beginner",
        "level": "A1",
        "dueDate": "2026-01-30"
    }
    
    try:
        response = requests.post(f"{base_url}/prompts/add", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_get_prompts():
    print("Testing get prompts endpoint...")
    
    try:
        response = requests.get(f"{base_url}/prompts")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_add_prompt()
    print("---")
    test_get_prompts()
import requests
import json
import os
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_auth_flow():
    print("=== Testing Authentication Flow ===")
    
    # Test login
    print("1. Testing login...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    print(f"Login status: {login_response.status_code}")
    print(f"Login response: {login_response.text}")
    
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print(f"Token received: {token}")
        return token
    else:
        print("Login failed, trying register...")
        
        # Try register
        register_response = requests.post(f"{BASE_URL}/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        print(f"Register status: {register_response.status_code}")
        print(f"Register response: {register_response.text}")
        
        if register_response.status_code == 200:
            token = register_response.json().get("access_token")
            print(f"Token from register: {token}")
            return token
    
    return None

def test_document_storage(token):
    print("\n=== Testing Document Storage ===")
    
    if not token:
        print("No token available, skipping document tests")
        return
    
    # Test uploading a document (mock)
    print("2. Testing document list...")
    headers = {"Authorization": f"Bearer {token}"}
    
    list_response = requests.get(f"{BASE_URL}/documents/list", headers=headers)
    print(f"List status: {list_response.status_code}")
    print(f"List response: {list_response.text}")
    
    # Test with a mock file upload
    print("3. Testing document upload (if test PDF exists)...")
    test_pdf_path = "test.pdf"
    
    if os.path.exists(test_pdf_path):
        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('test.pdf', f, 'application/pdf')}
            upload_response = requests.post(
                f"{BASE_URL}/documents/upload", 
                files=files, 
                headers=headers
            )
            print(f"Upload status: {upload_response.status_code}")
            print(f"Upload response: {upload_response.text}")
            
            # Check list again
            list_response2 = requests.get(f"{BASE_URL}/documents/list", headers=headers)
            print(f"List after upload: {list_response2.text}")
    else:
        print("No test.pdf found, skipping upload test")

def check_database_directly():
    print("\n=== Checking Database Directly ===")
    
    try:
        from app.core.supabase_client import get_supabase
        supabase = get_supabase()
        
        # Get all documents
        docs = supabase.table("documents").select("*").execute()
        print(f"Total documents in DB: {len(docs.data)}")
        
        for doc in docs.data:
            print(f"Document: {doc.get('filename')} | User: {doc.get('user_token')} | Created: {doc.get('created_at')}")
            
    except Exception as e:
        print(f"Database check failed: {e}")

if __name__ == "__main__":
    print(f"Testing at {datetime.now()}")
    print(f"Base URL: {BASE_URL}")
    
    # Test auth flow
    token = test_auth_flow()
    
    # Test document storage
    test_document_storage(token)
    
    # Check database
    check_database_directly()

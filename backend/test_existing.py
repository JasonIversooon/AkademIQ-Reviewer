from app.core.supabase_client import get_supabase
import hashlib

# Test with an existing user token
existing_token = "mJ_wxQMAWIg-sjdtdVlRLdS_Y0xFFMZzC4_BxDNG1ns"  # This user has 2 documents

print(f"Testing with existing token: {existing_token}")

supabase = get_supabase()

# Check documents for this user
docs = supabase.table("documents").select("*").eq("user_token", existing_token).execute()
print(f"Documents found: {len(docs.data)}")

for doc in docs.data:
    print(f"- {doc['filename']} (ID: {doc['id']}) - Created: {doc['created_at']}")

# Test what email would generate this token
# Since we changed to hash-based tokens, let's see what email corresponds to existing documents
print("\nTesting email-to-token generation:")
test_emails = ["test@example.com", "user@test.com", "admin@example.com"]

for email in test_emails:
    token = hashlib.sha256(email.encode()).hexdigest()[:32]
    docs_count = supabase.table("documents").select("id").eq("user_token", token).execute()
    print(f"Email: {email} -> Token: {token} -> Documents: {len(docs_count.data)}")
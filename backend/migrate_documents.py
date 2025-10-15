#!/usr/bin/env python3
"""
Migration script to add new columns to documents table and create cleanup functionality
"""

import os
import sys
from datetime import datetime, timedelta
from postgrest import APIError

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from core.supabase_client import get_supabase

def migrate_database():
    """Add new columns to documents table"""
    supabase = get_supabase()
    
    print("🔄 Starting database migration...")
    
    # We'll need to run these SQL commands in Supabase SQL editor
    # since we can't modify schema through the Python client
    sql_commands = """
    -- Add new columns to documents table
    ALTER TABLE documents 
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS pdf_data TEXT,
    ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    
    -- Update existing records with default values
    UPDATE documents 
    SET 
        file_size = COALESCE(LENGTH(content) * 2, 0),
        last_accessed = created_at,
        is_active = TRUE
    WHERE file_size IS NULL;
    
    -- Create index for cleanup queries
    CREATE INDEX IF NOT EXISTS idx_documents_cleanup 
    ON documents(is_active, last_accessed);
    
    -- Create index for user token queries
    CREATE INDEX IF NOT EXISTS idx_documents_user_token 
    ON documents(user_token, is_active, created_at DESC);
    """
    
    print("📝 SQL commands to run in Supabase SQL editor:")
    print(sql_commands)
    print("\n⚠️  Please run these commands in your Supabase SQL editor manually.")
    print("💡 Go to: Supabase Dashboard > SQL Editor > New Query")
    
    return True

def cleanup_old_documents():
    """Delete documents older than 7 days that haven't been accessed"""
    supabase = get_supabase()
    
    try:
        # Calculate 7 days ago
        seven_days_ago = datetime.now() - timedelta(days=7)
        seven_days_ago_str = seven_days_ago.isoformat()
        
        print(f"🧹 Cleaning up documents older than {seven_days_ago_str}")
        
        # Find old documents
        old_docs = supabase.table("documents")\
            .select("id, filename, created_at, last_accessed")\
            .eq("is_active", True)\
            .lt("last_accessed", seven_days_ago_str)\
            .execute()
        
        if old_docs.data:
            print(f"📄 Found {len(old_docs.data)} documents to cleanup:")
            for doc in old_docs.data:
                print(f"  - {doc['filename']} (last accessed: {doc.get('last_accessed', 'unknown')})")
            
            # Mark documents as inactive instead of deleting (soft delete)
            document_ids = [doc['id'] for doc in old_docs.data]
            
            result = supabase.table("documents")\
                .update({"is_active": False})\
                .in_("id", document_ids)\
                .execute()
            
            print(f"✅ Successfully marked {len(document_ids)} documents as inactive")
        else:
            print("✨ No old documents found to cleanup")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return False
    
    return True

def list_active_documents(user_token=None):
    """List all active documents for a user"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("documents")\
            .select("id, filename, created_at, page_count, file_size")\
            .eq("is_active", True)\
            .order("created_at", desc=True)
        
        if user_token:
            query = query.eq("user_token", user_token)
        
        docs = query.execute()
        
        if docs.data:
            print(f"📚 Found {len(docs.data)} active documents:")
            for doc in docs.data:
                size_mb = (doc.get('file_size', 0) or 0) / (1024 * 1024)
                print(f"  - {doc['filename']} ({doc.get('page_count', 0)} pages, {size_mb:.1f}MB)")
        else:
            print("📭 No active documents found")
            
        return docs.data
        
    except Exception as e:
        print(f"❌ Error listing documents: {e}")
        return []

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration and cleanup tool")
    parser.add_argument("--migrate", action="store_true", help="Run database migration")
    parser.add_argument("--cleanup", action="store_true", help="Cleanup old documents")
    parser.add_argument("--list", action="store_true", help="List active documents")
    parser.add_argument("--user-token", help="Filter by user token")
    
    args = parser.parse_args()
    
    if args.migrate:
        migrate_database()
    elif args.cleanup:
        cleanup_old_documents()
    elif args.list:
        list_active_documents(args.user_token)
    else:
        print("🚀 AkademIQ Database Tool")
        print("Usage:")
        print("  python migrate_documents.py --migrate    # Run database migration")
        print("  python migrate_documents.py --cleanup    # Cleanup old documents")
        print("  python migrate_documents.py --list       # List active documents")
        print("  python migrate_documents.py --list --user-token TOKEN  # List user documents")
#!/usr/bin/env python3
"""
Test script to verify Supabase connection
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test Supabase connection and configuration"""
    print("Testing Supabase connection...")
    
    # Get credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print(f"SUPABASE_URL: {supabase_url}")
    print(f"SUPABASE_KEY exists: {bool(supabase_key)}")
    print(f"SUPABASE_KEY length: {len(supabase_key) if supabase_key else 0}")
    
    if not supabase_url or not supabase_key:
        print("[ERROR] Missing Supabase credentials in .env file")
        return False
    
    try:
        # Create client
        client = create_client(supabase_url, supabase_key)
        print("[OK] Supabase client created successfully")
        
        # Test connection with a simple query
        response = client.table('users').select('count').limit(1).execute()
        print("[OK] Database connection test successful")
        print(f"Response: {response}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    if success:
        print("\n[SUCCESS] Supabase is properly configured!")
    else:
        print("\n[ERROR] Supabase configuration needs attention")
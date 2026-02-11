from supabase import create_client, Client
from config import Config
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseService:
    def __init__(self):
        try:
            # Get credentials directly from environment as fallback
            supabase_url = Config.SUPABASE_URL or os.getenv('SUPABASE_URL')
            supabase_key = Config.SUPABASE_KEY or os.getenv('SUPABASE_KEY')
            
            print(f"SUPABASE_URL: {supabase_url}")
            print(f"SUPABASE_KEY exists: {bool(supabase_key)}")
            
            if not supabase_url or not supabase_key:
                raise Exception("Supabase credentials missing. Please check your .env file.")
            
            self.client: Client = create_client(supabase_url, supabase_key)
            print("Supabase client created successfully")
            
            # Test the connection
            test_response = self.client.table('users').select('count').limit(1).execute()
            print("Supabase connection test successful")
            
        except Exception as e:
            print(f"Supabase initialization error: {e}")
            raise Exception(f"Supabase not configured: {str(e)}")
    
    def signup_user(self, email, password, first_name, last_name, username):
        """Create new user with Supabase Auth"""
        if not hasattr(self, 'client') or not self.client:
            raise Exception("Supabase not configured")
        try:
            # Create auth user first
            auth_response = self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            
            print(f"Auth response: {auth_response}")
            
            # Insert user profile
            if auth_response.user:
                profile_data = {
                    "id": auth_response.user.id,
                    "email": email,
                    "username": username,
                    "first_name": first_name,
                    "last_name": last_name,
                    "created_at": "now()"
                }
                
                print(f"Inserting profile: {profile_data}")
                
                profile_response = self.client.table('users').insert(profile_data).execute()
                print(f"Profile response: {profile_response}")
            
            return auth_response
        except Exception as e:
            print(f"Signup error: {str(e)}")
            raise e
    
    def signin_user(self, email, password):
        """Sign in user with Supabase Auth"""
        if not hasattr(self, 'client') or not self.client:
            raise Exception("Supabase not configured")
        try:
            print(f"Attempting signin for: {email}")
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            print(f"Signin successful: {response.user.email if response.user else 'No user'}")
            return response
        except Exception as e:
            print(f"Signin failed: {str(e)}")
            raise e
    
    def get_user_profile(self, user_id):
        """Get user profile from users table"""
        if not hasattr(self, 'client') or not self.client:
            return None
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
    
    def reset_password(self, email):
        """Send password reset email using Supabase Auth and log the request"""
        if not hasattr(self, 'client') or not self.client:
            raise Exception("Supabase not configured")
        try:
            # Send reset email via Supabase Auth
            response = self.client.auth.reset_password_email(email)
            
            # Log the password reset request in database
            try:
                # Get user ID if exists
                user_response = self.client.table('users').select('id').eq('email', email).execute()
                user_id = user_response.data[0]['id'] if user_response.data else None
                
                # Insert password reset record
                self.client.table('password_resets').insert({
                    'user_id': user_id,
                    'email': email,
                    'status': 'pending'
                }).execute()
            except Exception as log_error:
                print(f"Failed to log password reset: {str(log_error)}")
                # Don't fail the main operation if logging fails
            
            return response
        except Exception as e:
            print(f"Reset password error: {str(e)}")
            raise e
    
    def check_user_exists(self, email):
        """Check if user already exists"""
        if not hasattr(self, 'client') or not self.client:
            return False
        try:
            response = self.client.table('users').select('email').eq('email', email).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error checking user exists: {e}")
            return False
    
    def check_username_exists(self, username):
        """Check if username already exists"""
        if not hasattr(self, 'client') or not self.client:
            return False
        try:
            response = self.client.table('users').select('username').eq('username', username).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error checking username exists: {e}")
            return False

# Initialize service with proper error handling
try:
    supabase_service = SupabaseService()
except Exception as e:
    print(f"Failed to initialize Supabase service: {e}")
    supabase_service = None
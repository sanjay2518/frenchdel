from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password requirements"""
    return (
        len(password) >= 8 and
        re.search(r'[A-Z]', password) and
        re.search(r'[a-z]', password) and
        re.search(r'[0-9]', password)
    )

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].strip()
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Use Supabase auth to send reset email
        response = supabase_service.reset_password(email)
        
        return jsonify({
            'message': 'Password reset email sent successfully',
            'email': email
        }), 200
        
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return jsonify({'error': 'Failed to send reset email'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        # Check if Supabase service is available
        if not supabase_service:
            return jsonify({'error': 'Internal server error: Supabase not configured'}), 500
        data = request.get_json()
        print(f"Received data: {data}")
        
        # Validate required fields
        required_fields = ['email', 'password', 'firstName', 'lastName', 'username']
        for field in required_fields:
            if not data or field not in data or not str(data[field]).strip():
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].strip()
        password = data['password']
        first_name = data['firstName'].strip()
        last_name = data['lastName'].strip()
        username = data['username'].strip()
        
        print(f"Processing registration for: {email}")
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password requirements
        if not validate_password(password):
            return jsonify({'error': 'Password must be at least 8 characters with uppercase, lowercase, and number'}), 400
        
        # Check if username exists
        if supabase_service.check_username_exists(username):
            return jsonify({'error': 'Username already exists'}), 409
        
        # Create user
        response = supabase_service.signup_user(email, password, first_name, last_name, username)
        
        if response.user:
            return jsonify({
                'message': 'User registered successfully',
                'user': {
                    'id': response.user.id,
                    'email': response.user.email
                }
            }), 201
        else:
            return jsonify({'error': 'Failed to register user'}), 500
            
    except Exception as e:
        print(f"Registration error: {str(e)}")
        error_msg = str(e)
        
        if 'already registered' in error_msg.lower():
            return jsonify({'error': 'Email already exists'}), 409
        elif 'supabase not configured' in error_msg.lower():
            return jsonify({'error': 'Internal server error: Supabase not configured'}), 500
        
        return jsonify({'error': f'Internal server error: {error_msg}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        # Check if Supabase service is available
        if not supabase_service:
            return jsonify({'error': 'Internal server error: Supabase not configured'}), 500
        data = request.get_json()
        print(f"Login attempt: {data}")
        
        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip()
        password = data['password']
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Sign in user
        response = supabase_service.signin_user(email, password)
        print(f"Signin response: {response}")
        
        if response.user:
            # Get user profile
            profile = supabase_service.get_user_profile(response.user.id)
            print(f"Profile: {profile}")
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': response.user.id,
                    'email': response.user.email,
                    'firstName': profile['first_name'] if profile else '',
                    'lastName': profile['last_name'] if profile else '',
                    'username': profile['username'] if profile else ''
                },
                'session': {
                    'access_token': response.session.access_token if response.session else None,
                    'refresh_token': response.session.refresh_token if response.session else None
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        error_msg = str(e)
        
        if 'invalid' in error_msg.lower() or 'credentials' in error_msg.lower():
            return jsonify({'error': 'Invalid email or password'}), 401
        elif 'email not confirmed' in error_msg.lower():
            return jsonify({'error': 'Please check your email and confirm your account before signing in'}), 400
        elif 'supabase not configured' in error_msg.lower():
            return jsonify({'error': 'Internal server error: Supabase not configured'}), 500
        
        return jsonify({'error': f'Login error: {error_msg}'}), 500

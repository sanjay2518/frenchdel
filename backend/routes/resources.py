from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from datetime import datetime

resources_bp = Blueprint('resources', __name__)

@resources_bp.route('/resources/send', methods=['POST'])
def send_resource_to_user():
    """Admin sends learning resources/feedback to a specific user"""
    print("=== SEND RESOURCE TO USER ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        data = request.get_json()
        print(f"Resource data received: {data}")
        
        resource_data = {
            'user_id': data.get('userId'),
            'title': data.get('title'),
            'description': data.get('description'),
            'resource_type': data.get('type', 'feedback'),
            'content': data.get('content'),
            'priority': data.get('priority', 'normal'),
            'is_read': False
        }
        
        # Validate required fields
        if not resource_data['user_id'] or not resource_data['title']:
            return jsonify({'error': 'User ID and title are required'}), 400
        
        print(f"Prepared resource data: {resource_data}")
        
        # Insert into database
        try:
            result = supabase_service.client.table('user_resources').insert(resource_data).execute()
            print(f"Database insert result: {result}")
            
            if result.data and len(result.data) > 0:
                return jsonify({
                    'success': True,
                    'message': 'Resource sent successfully',
                    'resource': result.data[0]
                }), 201
            else:
                return jsonify({'error': 'Failed to send resource - no data returned'}), 500
                
        except Exception as db_error:
            error_str = str(db_error)
            print(f"Database error: {error_str}")
            
            # Check if table doesn't exist
            if 'user_resources' in error_str and ('not find' in error_str or 'does not exist' in error_str):
                return jsonify({
                    'error': 'The user_resources table does not exist. Please create it in Supabase SQL Editor.',
                    'sql': 'CREATE TABLE public.user_resources (id SERIAL PRIMARY KEY, user_id UUID NOT NULL, title VARCHAR(255) NOT NULL, description TEXT, resource_type VARCHAR(50) DEFAULT \'feedback\', content TEXT, priority VARCHAR(20) DEFAULT \'normal\', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());'
                }), 500
            
            return jsonify({'error': f'Database error: {error_str}'}), 500
            
    except Exception as e:
        print(f"EXCEPTION in send_resource_to_user: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@resources_bp.route('/resources/all', methods=['GET'])
def get_all_resources():
    """Get all sent resources for admin management"""
    print("=== GET ALL RESOURCES ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured', 'success': False}), 500
        
        # First try to get all resources without join
        try:
            result = supabase_service.client.table('user_resources').select('*').order('created_at', desc=True).execute()
            print(f"Found {len(result.data) if result.data else 0} total resources")
        except Exception as table_error:
            error_str = str(table_error)
            print(f"Error querying user_resources: {error_str}")
            if 'user_resources' in error_str:
                return jsonify({
                    'success': False,
                    'resources': [],
                    'error': 'user_resources table not found. Please create it in Supabase.'
                }), 200
            raise table_error
        
        # Get user details separately for each unique user_id
        user_ids = list(set([r.get('user_id') for r in result.data or [] if r.get('user_id')]))
        users_map = {}
        
        if user_ids:
            try:
                users_result = supabase_service.client.table('users').select('id, email, first_name, last_name').in_('id', user_ids).execute()
                for user in users_result.data or []:
                    users_map[user['id']] = user
            except Exception as user_error:
                print(f"Error fetching users: {user_error}")
                # Continue without user data
        
        resources = []
        for res in result.data or []:
            user_data = users_map.get(res.get('user_id'), {})
            user_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            
            resources.append({
                'id': res['id'],
                'userId': res.get('user_id'),
                'userName': user_name if user_name else None,
                'userEmail': user_data.get('email', ''),
                'title': res.get('title', ''),
                'description': res.get('description', ''),
                'type': res.get('resource_type', 'feedback'),
                'content': res.get('content', ''),
                'priority': res.get('priority', 'normal'),
                'isRead': res.get('is_read', False),
                'createdAt': res.get('created_at')
            })
        
        return jsonify({
            'success': True,
            'resources': resources,
            'count': len(resources)
        }), 200
        
    except Exception as e:
        print(f"EXCEPTION in get_all_resources: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Server error: {str(e)}', 'resources': []}), 200

@resources_bp.route('/resources/user/<user_id>', methods=['GET'])
def get_user_resources(user_id):
    """Get all resources for a specific user"""
    print(f"=== GET USER RESOURCES ENDPOINT CALLED for user: {user_id} ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Get resources for user ordered by created date (newest first)
        result = supabase_service.client.table('user_resources').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        print(f"Found {len(result.data) if result.data else 0} resources for user")
        
        resources = []
        for res in result.data or []:
            resources.append({
                'id': res['id'],
                'title': res['title'],
                'description': res.get('description', ''),
                'type': res.get('resource_type', 'feedback'),
                'content': res.get('content', ''),
                'priority': res.get('priority', 'normal'),
                'isRead': res.get('is_read', False),
                'createdAt': res.get('created_at')
            })
        
        return jsonify({
            'success': True,
            'resources': resources,
            'unreadCount': len([r for r in resources if not r['isRead']])
        }), 200
        
    except Exception as e:
        print(f"EXCEPTION in get_user_resources: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@resources_bp.route('/resources/<int:resource_id>/read', methods=['PUT'])
def mark_resource_read(resource_id):
    """Mark a resource as read"""
    print(f"=== MARK RESOURCE READ ENDPOINT CALLED for resource: {resource_id} ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        result = supabase_service.client.table('user_resources').update({'is_read': True}).eq('id', resource_id).execute()
        
        if result.data:
            return jsonify({'success': True, 'message': 'Resource marked as read'}), 200
        else:
            return jsonify({'error': 'Resource not found'}), 404
            
    except Exception as e:
        print(f"EXCEPTION in mark_resource_read: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@resources_bp.route('/resources/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """Delete a resource"""
    print(f"=== DELETE RESOURCE ENDPOINT CALLED for resource: {resource_id} ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        supabase_service.client.table('user_resources').delete().eq('id', resource_id).execute()
        return jsonify({'success': True, 'message': 'Resource deleted'}), 200
        
    except Exception as e:
        print(f"EXCEPTION in delete_resource: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@resources_bp.route('/admin/users-list', methods=['GET'])
def get_users_list():
    """Get list of all users for admin to send resources"""
    print("=== GET USERS LIST FOR ADMIN ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        users = []
        
        # Try to get users from submissions table with user details
        try:
            result = supabase_service.client.table('user_prompt_submissions').select(
                'user_id, users(id, email, first_name, last_name, username)'
            ).order('submitted_at', desc=True).execute()
            
            # Extract unique users
            seen_ids = set()
            for sub in result.data or []:
                user_data = sub.get('users')
                if user_data and user_data.get('id') and user_data['id'] not in seen_ids:
                    seen_ids.add(user_data['id'])
                    first_name = user_data.get('first_name', '') or ''
                    last_name = user_data.get('last_name', '') or ''
                    full_name = f"{first_name} {last_name}".strip()
                    
                    users.append({
                        'id': user_data['id'],
                        'email': user_data.get('email', ''),
                        'firstName': first_name,
                        'lastName': last_name,
                        'username': user_data.get('username', ''),
                        'fullName': full_name if full_name else user_data.get('username', '') or user_data.get('email', 'Unknown')
                    })
            
            print(f"Found {len(users)} unique users from submissions")
            
        except Exception as sub_error:
            print(f"Error fetching from submissions: {sub_error}")
            
            # Fallback: try direct users table
            try:
                result = supabase_service.client.table('users').select('*').execute()
                for user in result.data or []:
                    first_name = user.get('first_name', '') or ''
                    last_name = user.get('last_name', '') or ''
                    full_name = f"{first_name} {last_name}".strip()
                    
                    users.append({
                        'id': user['id'],
                        'email': user.get('email', ''),
                        'firstName': first_name,
                        'lastName': last_name,
                        'username': user.get('username', ''),
                        'fullName': full_name if full_name else user.get('email', 'Unknown')
                    })
                print(f"Found {len(users)} users from users table")
            except Exception as user_error:
                print(f"Error fetching from users table: {user_error}")
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        print(f"EXCEPTION in get_users_list: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500



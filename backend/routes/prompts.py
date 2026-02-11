from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from datetime import datetime

prompts_bp = Blueprint('prompts', __name__)

@prompts_bp.route('/prompts', methods=['GET'])
def get_prompts():
    """Get all prompts"""
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        print("=== GET PROMPTS ENDPOINT CALLED ===")
        print("Querying database for prompts...")
        
        # Force fresh query from database
        response = supabase_service.client.table('prompts').select('*').order('created_at', desc=True).execute()
        print(f"Raw database response: {response}")
        print(f"Database data count: {len(response.data) if response.data else 0}")
        
        if response.data:
            for i, prompt in enumerate(response.data):
                print(f"Prompt {i+1}: {prompt['title']} - {prompt['id']}")
        
        return jsonify({'prompts': response.data or []}), 200
        
    except Exception as e:
        print(f"ERROR in get_prompts: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@prompts_bp.route('/prompts/add', methods=['POST'])
def add_prompt():
    """Add new prompt"""
    print("=== ADD PROMPT ENDPOINT CALLED ===")
    try:
        if not supabase_service or not supabase_service.client:
            print("ERROR: Database not configured")
            return jsonify({'error': 'Database not configured'}), 500
        
        data = request.get_json()
        print(f"Received prompt data: {data}")
        
        prompt_data = {
            'title': data['title'],
            'description': data['description'],
            'type': data['type'],
            'difficulty': data['difficulty'],
            'level': data.get('level', 'A1'),
            'due_date': data.get('dueDate'),
            'status': 'active'
        }
        
        print(f"Prepared data for insertion: {prompt_data}")
        
        # Direct insert without upsert
        print("Attempting database insert...")
        response = supabase_service.client.table('prompts').insert(prompt_data).execute()
        print(f"Database insert response: {response}")
        print(f"Response data: {response.data}")
        
        if response.data and len(response.data) > 0:
            print(f"SUCCESS: Inserted prompt with ID: {response.data[0]['id']}")
            return jsonify({'success': True, 'message': 'Prompt added successfully', 'prompt': response.data[0]}), 201
        else:
            print("ERROR: No data returned from insert")
            return jsonify({'error': 'Failed to insert prompt'}), 500
            
    except Exception as e:
        print(f"EXCEPTION in add_prompt: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@prompts_bp.route('/prompts/<int:prompt_id>', methods=['DELETE'])
def delete_prompt(prompt_id):
    """Delete prompt"""
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        supabase_service.client.table('prompts').delete().eq('id', prompt_id).execute()
        return jsonify({'message': 'Prompt deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@prompts_bp.route('/prompts/type/<prompt_type>', methods=['GET'])
def get_prompts_by_type(prompt_type):
    """Get prompts filtered by type (speaking/writing) for user practice"""
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        print(f"=== GET PROMPTS BY TYPE ENDPOINT CALLED ===")
        print(f"Fetching {prompt_type} prompts from database...")
        
        # Validate prompt type
        if prompt_type not in ['speaking', 'writing']:
            return jsonify({'error': 'Invalid prompt type. Use "speaking" or "writing"'}), 400
        
        # Get active prompts of specified type
        response = supabase_service.client.table('prompts').select('*').eq('type', prompt_type).eq('status', 'active').order('created_at', desc=True).execute()
        print(f"Found {len(response.data) if response.data else 0} {prompt_type} prompts")
        
        # Format prompts for frontend
        prompts = []
        for prompt in (response.data or []):
            prompts.append({
                'id': prompt['id'],
                'title': prompt['title'],
                'description': prompt['description'],
                'difficulty': prompt['difficulty'],
                'level': prompt.get('level', 'A1'),
                'timeLimit': 180 if prompt_type == 'speaking' else None,  # Default 3 min for speaking
                'wordGoal': 150 if prompt_type == 'writing' else None,  # Default 150 words for writing
                'dueDate': prompt.get('due_date')
            })
        
        return jsonify({'success': True, 'prompts': prompts}), 200
        
    except Exception as e:
        print(f"ERROR in get_prompts_by_type: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@prompts_bp.route('/prompts/difficulty/<difficulty_level>', methods=['GET'])
def get_prompts_by_difficulty(difficulty_level):
    """Get prompts filtered by difficulty level (beginner/intermediate/advanced) for lessons page"""
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        print(f"=== GET PROMPTS BY DIFFICULTY ENDPOINT CALLED ===")
        print(f"Fetching {difficulty_level} prompts from database...")
        
        # Validate difficulty level
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if difficulty_level.lower() not in valid_levels:
            return jsonify({'error': f'Invalid difficulty level. Use one of: {", ".join(valid_levels)}'}), 400
        
        # Get active prompts of specified difficulty level
        response = supabase_service.client.table('prompts').select('*').eq('difficulty', difficulty_level.lower()).eq('status', 'active').order('created_at', desc=True).execute()
        print(f"Found {len(response.data) if response.data else 0} {difficulty_level} prompts")
        
        # Format prompts for frontend (lessons page)
        lessons = []
        for prompt in (response.data or []):
            lessons.append({
                'id': prompt['id'],
                'title': prompt['title'],
                'description': prompt['description'],
                'type': prompt['type'],
                'difficulty': prompt['difficulty'],
                'level': prompt.get('level', 'A1'),
                'duration': '20 min',  # Default duration
                'xp': 50 if difficulty_level == 'beginner' else (80 if difficulty_level == 'intermediate' else 120),
                'topics': [],  # Can be extended later
                'dueDate': prompt.get('due_date'),
                'createdAt': prompt.get('created_at')
            })
        
        return jsonify({
            'success': True, 
            'lessons': lessons,
            'count': len(lessons),
            'difficulty': difficulty_level
        }), 200
        
    except Exception as e:
        print(f"ERROR in get_prompts_by_difficulty: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@prompts_bp.route('/prompts/user/<user_id>', methods=['GET'])
def get_user_prompts(user_id):
    """Get prompts for specific user"""
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        print(f"Getting prompts for user: {user_id}")
        
        # Get all active prompts
        prompts_response = supabase_service.client.table('prompts').select('*').eq('status', 'active').execute()
        print(f"Prompts response: {prompts_response}")
        
        # For now, just return all prompts as pending since submissions table might not exist
        prompts = []
        for prompt in prompts_response.data:
            prompt['status'] = 'pending'
            prompt['dueDate'] = prompt.get('due_date')
            prompts.append(prompt)
        
        print(f"Returning prompts: {prompts}")
        return jsonify({'prompts': prompts}), 200
        
    except Exception as e:
        print(f"Error getting user prompts: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
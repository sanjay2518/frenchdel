from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

admin_prompts_bp = Blueprint('admin_prompts', __name__)

@admin_prompts_bp.route('/admin/create-prompt', methods=['POST'])
def create_admin_prompt():
    """Create new prompt from admin panel"""
    print("=== ADMIN CREATE PROMPT ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            print("ERROR: Supabase not configured")
            return jsonify({'error': 'Database not configured'}), 500
        
        data = request.get_json()
        print(f"Admin prompt data received: {data}")
        
        # Prepare data for database insertion
        prompt_data = {
            'title': data.get('title'),
            'description': data.get('description'),
            'type': data.get('type', 'speaking'),
            'difficulty': data.get('difficulty', 'beginner'),
            'level': data.get('level', 'A1'),
            'due_date': data.get('dueDate'),
            'status': 'active'
        }
        
        print(f"Prepared data for database: {prompt_data}")
        
        # Insert directly into database
        print("Inserting into database...")
        result = supabase_service.client.table('prompts').insert(prompt_data).execute()
        print(f"Database insert result: {result}")
        
        if result.data and len(result.data) > 0:
            inserted_prompt = result.data[0]
            print(f"SUCCESS: Prompt inserted with ID: {inserted_prompt['id']}")
            
            # Verify it was actually stored
            verify = supabase_service.client.table('prompts').select('*').eq('id', inserted_prompt['id']).execute()
            print(f"Verification query result: {verify}")
            
            if verify.data:
                print("VERIFIED: Prompt is stored in database")
                return jsonify({
                    'success': True,
                    'message': 'Prompt created successfully',
                    'prompt': inserted_prompt
                }), 201
            else:
                print("ERROR: Prompt not found after insertion")
                return jsonify({'error': 'Prompt not saved properly'}), 500
        else:
            print("ERROR: No data returned from insert")
            return jsonify({'error': 'Failed to create prompt'}), 500
            
    except Exception as e:
        print(f"EXCEPTION in create_admin_prompt: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@admin_prompts_bp.route('/admin/get-prompts', methods=['GET'])
def get_admin_prompts():
    """Get all prompts for admin panel"""
    print("=== ADMIN GET PROMPTS ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        print("Fetching all prompts from database...")
        result = supabase_service.client.table('prompts').select('*').order('created_at', desc=True).execute()
        print(f"Database query result: {result}")
        print(f"Found {len(result.data) if result.data else 0} prompts")
        
        return jsonify({
            'success': True,
            'prompts': result.data or []
        }), 200
        
    except Exception as e:
        print(f"EXCEPTION in get_admin_prompts: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@admin_prompts_bp.route('/admin/submit-task', methods=['POST'])
def submit_task():
    """Submit completed task"""
    print("=== SUBMIT TASK ENDPOINT CALLED ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        data = request.get_json()
        print(f"Task submission data: {data}")
        
        # Create submission record
        submission_data = {
            'user_id': data.get('userId'),
            'prompt_id': data.get('promptId'),
            'submission_text': data.get('submission'),
            'submission_file_path': data.get('audioFile'),
            'status': 'pending'
        }
        
        print(f"Creating submission record: {submission_data}")
        result = supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
        print(f"Submission result: {result}")
        
        if result.data:
            print("SUCCESS: Task submitted and marked as completed")
            return jsonify({
                'success': True,
                'message': 'Task completed successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to submit task'}), 500
            
    except Exception as e:
        print(f"EXCEPTION in submit_task: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@admin_prompts_bp.route('/user/submissions/<user_id>', methods=['GET'])
def get_user_submissions(user_id):
    """Get all submissions for a specific user with feedback"""
    print(f"=== GET USER SUBMISSIONS ENDPOINT CALLED for user: {user_id} ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Get user's submissions with prompt details
        result = supabase_service.client.table('user_prompt_submissions').select(
            '*, prompts(title, type, description)'
        ).eq('user_id', user_id).order('submitted_at', desc=True).execute()
        
        submissions = []
        for sub in result.data or []:
            prompt = sub.get('prompts', {})
            submissions.append({
                'id': sub['id'],
                'promptId': sub['prompt_id'],
                'title': prompt.get('title', 'Unknown Prompt') if prompt else 'Unknown Prompt',
                'type': prompt.get('type', 'unknown') if prompt else 'unknown',
                'description': prompt.get('description', '') if prompt else '',
                'submissionText': sub.get('submission_text'),
                'audioFile': sub.get('submission_file_path'),
                'status': sub['status'],
                'score': sub.get('score'),
                'feedback': sub.get('feedback'),
                'submittedAt': sub['submitted_at']
            })
        
        return jsonify({
            'success': True,
            'submissions': submissions
        }), 200
        
    except Exception as e:
        print(f"EXCEPTION in get_user_submissions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500
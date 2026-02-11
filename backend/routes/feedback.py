from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from services.ai_feedback_service import ai_feedback_service

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback/writing', methods=['POST'])
def get_writing_feedback():
    """Generate AI feedback for writing practice submission"""
    print("=== WRITING FEEDBACK ENDPOINT CALLED ===")
    
    try:
        data = request.get_json()
        print(f"Received writing feedback request: {data}")
        
        prompt_title = data.get('promptTitle', 'Writing Practice')
        prompt_description = data.get('promptDescription', '')
        user_response = data.get('response', '')
        difficulty = data.get('difficulty', 'intermediate')
        user_id = data.get('userId')
        prompt_id = data.get('promptId')
        
        if not user_response:
            return jsonify({'error': 'No response provided'}), 400
        
        # Generate AI feedback
        feedback = ai_feedback_service.generate_writing_feedback(
            prompt_title=prompt_title,
            prompt_description=prompt_description,
            user_response=user_response,
            difficulty_level=difficulty
        )
        
        # Store submission and feedback in database if user is authenticated
        if user_id and prompt_id and supabase_service and supabase_service.client:
            try:
                submission_data = {
                    'user_id': user_id,
                    'prompt_id': prompt_id,
                    'submission_text': user_response,
                    'status': 'reviewed',
                    'score': feedback.get('overall_score'),
                    'feedback': str(feedback)
                }
                supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
                print("Submission saved to database")
            except Exception as db_error:
                print(f"Error saving to database: {str(db_error)}")
        
        return jsonify({
            'success': True,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        print(f"Error in get_writing_feedback: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/feedback/speaking', methods=['POST'])
def get_speaking_feedback():
    """Generate AI feedback for speaking practice submission"""
    print("=== SPEAKING FEEDBACK ENDPOINT CALLED ===")
    
    try:
        data = request.get_json()
        print(f"Received speaking feedback request")
        
        prompt_title = data.get('promptTitle', 'Speaking Practice')
        prompt_description = data.get('promptDescription', '')
        transcription = data.get('transcription')  # Optional - if speech-to-text is available
        duration = data.get('duration', 0)
        difficulty = data.get('difficulty', 'intermediate')
        user_id = data.get('userId')
        prompt_id = data.get('promptId')
        audio_file_path = data.get('audioFilePath')
        
        # Generate AI feedback
        feedback = ai_feedback_service.generate_speaking_feedback(
            prompt_title=prompt_title,
            prompt_description=prompt_description,
            transcription=transcription,
            duration=duration,
            difficulty_level=difficulty
        )
        
        # Store submission and feedback in database if user is authenticated
        if user_id and prompt_id and supabase_service and supabase_service.client:
            try:
                submission_data = {
                    'user_id': user_id,
                    'prompt_id': prompt_id,
                    'submission_file_path': audio_file_path,
                    'status': 'reviewed',
                    'score': feedback.get('overall_score'),
                    'feedback': str(feedback)
                }
                supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
                print("Submission saved to database")
            except Exception as db_error:
                print(f"Error saving to database: {str(db_error)}")
        
        return jsonify({
            'success': True,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        print(f"Error in get_speaking_feedback: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/feedback/history/<user_id>', methods=['GET'])
def get_feedback_history(user_id):
    """Get feedback history for a user"""
    print(f"=== GET FEEDBACK HISTORY for user: {user_id} ===")
    
    try:
        if not supabase_service or not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        result = supabase_service.client.table('user_prompt_submissions').select(
            '*, prompts(title, type, description, difficulty)'
        ).eq('user_id', user_id).order('submitted_at', desc=True).execute()
        
        feedback_history = []
        for submission in result.data or []:
            prompt = submission.get('prompts', {})
            feedback_history.append({
                'id': submission['id'],
                'promptTitle': prompt.get('title', 'Unknown'),
                'type': prompt.get('type', 'unknown'),
                'score': submission.get('score'),
                'feedback': submission.get('feedback'),
                'submittedAt': submission.get('submitted_at'),
                'status': submission.get('status')
            })
        
        return jsonify({
            'success': True,
            'history': feedback_history
        }), 200
        
    except Exception as e:
        print(f"Error getting feedback history: {str(e)}")
        return jsonify({'error': str(e)}), 500

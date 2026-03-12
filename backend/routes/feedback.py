from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from services.ai_feedback_service import ai_feedback_service

feedback_bp = Blueprint('feedback', __name__)

# ─── Audio Transcription Endpoint ────────────────────────────────────
@feedback_bp.route('/feedback/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcribe audio using Gemini AI (works on ALL devices).
    Accepts audio file upload via multipart/form-data.
    """
    print("=== TRANSCRIBE AUDIO ENDPOINT CALLED ===")
    
    try:
        # Check if audio file is in the request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({'error': 'Empty audio file'}), 400
        
        # Read audio data
        audio_data = audio_file.read()
        mime_type = audio_file.content_type or 'audio/webm'
        
        print(f"Received audio: {len(audio_data)} bytes, type: {mime_type}")
        
        # Transcribe using Gemini
        result = ai_feedback_service.transcribe_audio(audio_data, mime_type)
        
        return jsonify({
            'success': result.get('success', False),
            'transcription': result.get('transcription', ''),
            'language': result.get('language', 'unknown'),
            'is_french': result.get('is_french', False),
            'confidence': result.get('confidence', 0),
            'error': result.get('error')
        }), 200
        
    except Exception as e:
        print(f"Error in transcribe_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ─── Combined Transcribe + Feedback Endpoint ─────────────────────────
@feedback_bp.route('/feedback/transcribe-and-feedback', methods=['POST'])
def transcribe_and_feedback():
    """Transcribe audio AND generate AI feedback in one call.
    Most efficient for mobile — sends audio, gets back transcription + feedback.
    Accepts audio file upload via multipart/form-data.
    """
    print("=== TRANSCRIBE + FEEDBACK ENDPOINT CALLED ===")
    
    try:
        # Check if audio file is in the request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({'error': 'Empty audio file'}), 400
        
        # Read audio data
        audio_data = audio_file.read()
        mime_type = audio_file.content_type or 'audio/webm'
        duration = request.form.get('duration', 0, type=float)
        user_id = request.form.get('userId')
        
        print(f"Received audio: {len(audio_data)} bytes, type: {mime_type}, duration: {duration}s")
        
        # Transcribe and get feedback
        feedback = ai_feedback_service.transcribe_and_feedback(
            audio_data=audio_data,
            mime_type=mime_type,
            duration=duration
        )
        
        # Store submission in database if user is authenticated
        if user_id and feedback.get('is_valid') and supabase_service and supabase_service.client:
            try:
                submission_data = {
                    'user_id': user_id,
                    'submission_text': feedback.get('transcription', ''),
                    'status': 'reviewed',
                    'score': feedback.get('overall_score'),
                    'feedback': str(feedback)
                }
                supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
                print("Transcribe+Feedback submission saved to database")
            except Exception as db_error:
                print(f"Error saving to database: {str(db_error)}")
        
        return jsonify({
            'success': True,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        print(f"Error in transcribe_and_feedback: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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

@feedback_bp.route('/feedback/free-speaking', methods=['POST'])
def get_free_speaking_feedback():
    """Generate AI feedback for free-form speaking practice (no prompt needed).
    Supports TWO modes:
    1. JSON body with 'transcription' text (from browser speech-to-text)
    2. Multipart form with 'audio' file (server-side transcription via Gemini)
    """
    print("=== FREE SPEAKING FEEDBACK ENDPOINT CALLED ===")
    
    try:
        # Check if this is an audio upload (multipart) or text transcription (JSON)
        if request.content_type and 'multipart' in request.content_type:
            # MODE 2: Audio file upload → server-side transcription + feedback
            print("Mode: Audio upload (server-side transcription)")
            
            if 'audio' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400
            
            audio_file = request.files['audio']
            audio_data = audio_file.read()
            mime_type = audio_file.content_type or 'audio/webm'
            duration = request.form.get('duration', 0, type=float)
            user_id = request.form.get('userId')
            
            print(f"Received audio: {len(audio_data)} bytes, type: {mime_type}, duration: {duration}s")
            
            # Use combined transcribe + feedback
            feedback = ai_feedback_service.transcribe_and_feedback(
                audio_data=audio_data,
                mime_type=mime_type,
                duration=duration
            )
            
            # Store submission in database if user is authenticated
            if user_id and feedback.get('is_valid') and supabase_service and supabase_service.client:
                try:
                    submission_data = {
                        'user_id': user_id,
                        'submission_text': feedback.get('transcription', ''),
                        'status': 'reviewed',
                        'score': feedback.get('overall_score'),
                        'feedback': str(feedback)
                    }
                    supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
                    print("Audio-based free speaking submission saved to database")
                except Exception as db_error:
                    print(f"Error saving to database: {str(db_error)}")
            
            return jsonify({
                'success': True,
                'feedback': feedback
            }), 200
        
        else:
            # MODE 1: JSON body with text transcription (original behavior)
            print("Mode: Text transcription (browser speech-to-text)")
            
            data = request.get_json()
            print(f"Received free speaking feedback request")
            
            transcription = data.get('transcription', '')
            duration = data.get('duration', 0)
            user_id = data.get('userId')
            
            if not transcription or len(transcription.strip()) < 10:
                return jsonify({
                    'success': True,
                    'feedback': {
                        'type': 'free-speaking',
                        'ai_generated': True,
                        'is_valid': False,
                        'error': 'no_transcription',
                        'message': 'No French speech was detected. Please speak in French while recording.',
                        'overall_score': 0
                    }
                }), 200
            
            # Generate AI feedback using the free speaking method
            feedback = ai_feedback_service.generate_free_speaking_feedback(
                transcription=transcription,
                duration=duration
            )
            
            # Store submission in database if user is authenticated
            if user_id and supabase_service and supabase_service.client:
                try:
                    submission_data = {
                        'user_id': user_id,
                        'submission_text': transcription,
                        'status': 'reviewed',
                        'score': feedback.get('overall_score'),
                        'feedback': str(feedback)
                    }
                    supabase_service.client.table('user_prompt_submissions').insert(submission_data).execute()
                    print("Free speaking submission saved to database")
                except Exception as db_error:
                    print(f"Error saving to database: {str(db_error)}")
            
            return jsonify({
                'success': True,
                'feedback': feedback
            }), 200
        
    except Exception as e:
        print(f"Error in get_free_speaking_feedback: {str(e)}")
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

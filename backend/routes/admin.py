from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
from services.supabase_service import supabase_service

admin_bp = Blueprint('admin', __name__)

# Mock database for non-user data
submissions_db = []
prompts_db = []

@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        if not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Get all users from Supabase
        response = supabase_service.client.table('users').select('*').order('created_at', desc=True).execute()
        
        users = []
        for user in response.data:
            users.append({
                'id': user['id'],
                'name': f"{user['first_name']} {user['last_name']}",
                'email': user['email'],
                'username': user['username'],
                'status': 'active',  # Default status
                'subscription': 'free',  # Default subscription
                'joinDate': user['created_at'][:10] if user['created_at'] else 'N/A'
            })
        
        # Get user statistics
        total_users = len(users)
        active_users = len([u for u in users if u['status'] == 'active'])
        
        return jsonify({
            'users': users,
            'stats': {
                'total': total_users,
                'active': active_users,
                'recent': len([u for u in users[:10]])  # Recent 10 users
            }
        })
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/toggle-status', methods=['POST'])
def toggle_user_status(user_id):
    try:
        # For now, return success - can be extended to update user status in a separate table
        return jsonify({'success': True, 'message': 'User status updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/subscriptions', methods=['GET'])
def get_subscriptions():
    try:
        subscriptions = [
            {'id': 1, 'user': 'Jane Smith', 'email': 'jane@example.com', 'plan': 'premium', 'status': 'active', 'startDate': '2024-01-08', 'endDate': '2025-01-08', 'amount': '$29.99'}
        ]
        stats = {'active': 1, 'revenue': 29.99, 'cancelled': 0}
        return jsonify({'subscriptions': subscriptions, 'stats': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
def cancel_subscription(subscription_id):
    try:
        # In production, cancel subscription in database
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/subscriptions/<subscription_id>/reactivate', methods=['POST'])
def reactivate_subscription(subscription_id):
    try:
        # In production, reactivate subscription in database
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/submissions', methods=['GET'])
def get_submissions():
    try:
        if not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        status_filter = request.args.get('status')
        
        # Get submissions with user and prompt details
        query = supabase_service.client.table('user_prompt_submissions').select(
            '*, users(first_name, last_name, email), prompts(title, type)'
        ).order('submitted_at', desc=True)
        
        # Apply status filter if provided
        if status_filter:
            query = query.eq('status', status_filter)
        
        result = query.execute()
        
        submissions = []
        for sub in result.data or []:
            user_name = f"{sub['users']['first_name']} {sub['users']['last_name']}" if sub.get('users') else 'Unknown User'
            prompt_title = sub['prompts']['title'] if sub.get('prompts') else 'Unknown Prompt'
            prompt_type = sub['prompts']['type'] if sub.get('prompts') else 'unknown'
            
            submissions.append({
                'id': sub['id'],
                'userId': sub['user_id'],
                'userName': user_name,
                'userEmail': sub['users']['email'] if sub.get('users') else '',
                'promptId': sub['prompt_id'],
                'promptTitle': prompt_title,
                'type': prompt_type,
                'audioFile': sub.get('submission_file_path'),
                'submissionText': sub.get('submission_text'),
                'status': sub['status'],
                'score': sub.get('score'),
                'feedback': sub.get('feedback'),
                'submitted_at': sub['submitted_at']
            })
        
        return jsonify({'submissions': submissions})
    except Exception as e:
        print(f"Error fetching submissions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/submissions/<submission_id>', methods=['DELETE'])
def delete_submission(submission_id):
    """Delete a submission"""
    print(f"=== DELETE SUBMISSION ENDPOINT CALLED for ID: {submission_id} ===")
    
    try:
        if not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Delete the submission from database
        result = supabase_service.client.table('user_prompt_submissions').delete().eq('id', submission_id).execute()
        
        print(f"Delete result: {result}")
        
        return jsonify({
            'success': True,
            'message': 'Submission deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting submission: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/submissions/<submission_id>/feedback', methods=['POST'])
def add_feedback(submission_id):
    try:
        if not supabase_service.client:
            return jsonify({'error': 'Database not configured'}), 500
        
        data = request.get_json()
        score = data.get('score')
        comments = data.get('comments')
        
        # Update submission in database with feedback
        update_data = {
            'status': 'reviewed',
            'score': int(score) if score else None,
            'feedback': comments
        }
        
        result = supabase_service.client.table('user_prompt_submissions').update(update_data).eq('id', submission_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Submission not found'}), 404
        
        # Get user email for notification
        submission = result.data[0]
        user_result = supabase_service.client.table('users').select('email, first_name').eq('id', submission['user_id']).single().execute()
        
        if user_result.data:
            user_email = user_result.data['email']
            user_name = user_result.data['first_name']
            # Send email notification (handled by notifications route)
            try:
                import requests
                requests.post('http://localhost:5000/api/notifications/send-feedback-notification', json={
                    'email': user_email,
                    'submission_title': f"Submission {submission_id[:8]}",
                    'user_name': user_name,
                    'score': score,
                    'feedback': comments
                })
            except Exception as notify_error:
                print(f"Failed to send notification: {notify_error}")
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
    except Exception as e:
        print(f"Error adding feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/prompts', methods=['GET'])
def get_prompts():
    try:
        return jsonify({'prompts': prompts_db})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/prompts/add', methods=['POST'])
def add_prompt():
    try:
        data = request.get_json()
        prompt = {
            'id': str(uuid.uuid4()),
            'title': data.get('title'),
            'description': data.get('description'),
            'type': data.get('type'),
            'difficulty': data.get('difficulty'),
            'created_at': datetime.now().isoformat()
        }
        prompts_db.append(prompt)
        return jsonify({'success': True, 'prompt': prompt})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/prompts/<prompt_id>', methods=['DELETE'])
def delete_prompt(prompt_id):
    try:
        global prompts_db
        prompts_db = [p for p in prompts_db if str(p['id']) != prompt_id]
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

subscription_bp = Blueprint('subscription', __name__)

# In production, this would connect to a payment processor like Stripe
SUBSCRIPTION_PLANS = {
    'free': {'price': 0, 'features': ['basic_feedback'], 'submissions_limit': 5},
    'premium': {'price': 29.99, 'features': ['advanced_feedback', 'unlimited_submissions', 'priority_support'], 'submissions_limit': -1}
}

@subscription_bp.route('/update-subscription', methods=['POST'])
def update_subscription():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        plan_type = data.get('plan_type', 'free')
        payment_token = data.get('payment_token')  # From payment processor
        
        if plan_type not in SUBSCRIPTION_PLANS:
            return jsonify({'error': 'Invalid subscription plan'}), 400
        
        # For premium plans, validate payment (simplified)
        if plan_type == 'premium' and not payment_token:
            return jsonify({'error': 'Payment required for premium plan'}), 400
        
        # Calculate expiration date
        if plan_type == 'premium':
            expires_at = datetime.now() + timedelta(days=365)
        else:
            expires_at = None
        
        subscription_data = {
            'user_id': user_id,
            'type': plan_type,
            'status': 'active',
            'expires_at': expires_at.isoformat() if expires_at else None,
            'features': SUBSCRIPTION_PLANS[plan_type]['features'],
            'created_at': datetime.now().isoformat(),
            'subscription_id': str(uuid.uuid4())
        }
        
        # In production, save to database
        # db.subscriptions.insert_one(subscription_data)
        
        return jsonify({
            'success': True,
            'subscription': subscription_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/cancel-subscription', methods=['POST'])
def cancel_subscription():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # In production, update database and cancel with payment processor
        return jsonify({
            'success': True,
            'message': 'Subscription cancelled successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
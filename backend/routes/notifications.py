from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/send-admin-email', methods=['POST'])
def send_admin_email():
    try:
        data = request.get_json()
        user_email = data.get('email')
        message = data.get('message')
        
        # Email configuration
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        
        if not all([sender_email, sender_password]):
            return jsonify({'error': 'Email configuration missing'}), 500
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = user_email
        msg['Subject'] = 'Message from French Learning Admin'
        
        body = f"""
        Hello,
        
        {message}
        
        Best regards,
        French Learning Admin Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        return jsonify({'success': True, 'message': 'Email sent successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/send-feedback-notification', methods=['POST'])
def send_feedback_notification():
    try:
        data = request.get_json()
        user_email = data.get('email')
        submission_title = data.get('submission_title')
        
        # Email configuration (use environment variables in production)
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        
        if not all([sender_email, sender_password]):
            return jsonify({'error': 'Email configuration missing'}), 500
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = user_email
        msg['Subject'] = 'Your French Practice Feedback is Ready!'
        
        body = f"""
        Bonjour!
        
        Your feedback for "{submission_title}" is now available in your dashboard.
        
        Log in to view your detailed feedback and continue improving your French!
        
        Best regards,
        French Learning Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        return jsonify({'success': True, 'message': 'Email sent successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
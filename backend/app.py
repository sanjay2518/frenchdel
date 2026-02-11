from flask import Flask, request
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.notifications import notifications_bp
from routes.uploads import uploads_bp
from routes.subscription import subscription_bp
from routes.materials import materials_bp
from routes.admin import admin_bp
from routes.prompts import prompts_bp
from routes.admin_prompts import admin_prompts_bp
from routes.feedback import feedback_bp
from routes.resources import resources_bp
from services.supabase_service import supabase_service

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:3001', 
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://french-learning-app-fnpy.onrender.com'
])

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
app.register_blueprint(materials_bp, url_prefix='/api/materials')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(prompts_bp, url_prefix='/api')
app.register_blueprint(admin_prompts_bp, url_prefix='/api')
app.register_blueprint(feedback_bp, url_prefix='/api')
app.register_blueprint(resources_bp, url_prefix='/api')

@app.route('/')
def home():
    return {'message': 'Flask + Supabase API'}

@app.route('/health')
def health():
    try:
        if not supabase_service or not hasattr(supabase_service, 'client') or not supabase_service.client:
            return {'status': 'unhealthy', 'database': 'not configured', 'error': 'Supabase client not initialized'}, 503
        
        # Test connection with a simple query
        test_response = supabase_service.client.table('users').select('count').limit(1).execute()
        return {'status': 'healthy', 'database': 'connected'}, 200
    except Exception as e:
        return {'status': 'unhealthy', 'database': 'disconnected', 'error': str(e)}, 503

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

from flask import Blueprint, request, jsonify, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename

uploads_bp = Blueprint('uploads', __name__)

UPLOAD_FOLDER = 'uploads/audio'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'webm', 'm4a', 'ogg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@uploads_bp.route('/upload-audio', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large'}), 400
        
        # Create upload directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        
        return jsonify({
            'success': True,
            'filename': unique_filename,
            'file_id': unique_filename,
            'file_path': file_path,
            'file_size': file_size
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@uploads_bp.route('/audio/<filename>')
def serve_audio(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404
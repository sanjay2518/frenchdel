from flask import Blueprint, request, jsonify
import os
import uuid
from werkzeug.utils import secure_filename

materials_bp = Blueprint('materials', __name__)

UPLOAD_FOLDER = 'uploads/materials'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'webm', 'm4a', 'ogg', 'mov', 'avi'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@materials_bp.route('/upload-material', methods=['POST'])
def upload_material():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        title = request.form.get('title', file.filename)
        category = request.form.get('category', 'general')
        
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
        
        # Create upload directory
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Determine file type
        file_type = 'video' if file_extension in ['mp4', 'webm', 'mov', 'avi'] else 'audio'
        
        return jsonify({
            'success': True,
            'material': {
                'id': unique_filename,
                'title': title,
                'type': file_type,
                'category': category,
                'file_path': file_path,
                'file_size': file_size
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/add-writing', methods=['POST'])
def add_writing_material():
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        category = data.get('category', 'writing')
        
        if not title or not content:
            return jsonify({'error': 'Title and content required'}), 400
        
        # In production, save to database
        material = {
            'id': str(uuid.uuid4()),
            'title': title,
            'content': content,
            'type': 'writing',
            'category': category,
            'created_at': '2024-01-15'
        }
        
        return jsonify({
            'success': True,
            'material': material
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials/<material_id>', methods=['DELETE'])
def delete_material(material_id):
    try:
        # In production, delete from database
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials', methods=['GET'])
def get_materials():
    try:
        # In production, fetch from database
        materials = [
            {'id': 1, 'title': 'French Pronunciation Basics', 'type': 'audio', 'category': 'pronunciation'},
            {'id': 2, 'title': 'Grammar Lesson: Past Tense', 'type': 'video', 'category': 'grammar'},
            {'id': 3, 'title': 'Essay Writing Guide', 'type': 'writing', 'category': 'writing', 'content': 'Complete guide...'}
        ]
        return jsonify({'materials': materials})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
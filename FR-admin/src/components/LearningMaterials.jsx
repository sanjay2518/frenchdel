import { useState, useEffect } from 'react';
import { Upload, Play, Video, Volume2, Trash2, Eye, FileText, Plus } from 'lucide-react';

const LearningMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showWritingForm, setShowWritingForm] = useState(false);
  const [writingContent, setWritingContent] = useState({ title: '', content: '', category: 'writing' });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.split('.')[0]);
      formData.append('category', 'general');
      
      const response = await fetch('http://localhost:5000/api/materials/upload-material', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await fetchMaterials();
        // Reset file input
        event.target.value = '';
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/materials/materials');
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const addWritingMaterial = async () => {
    if (!writingContent.title || !writingContent.content) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/materials/add-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(writingContent)
      });
      
      if (response.ok) {
        await fetchMaterials();
        setWritingContent({ title: '', content: '', category: 'writing' });
        setShowWritingForm(false);
      }
    } catch (error) {
      console.error('Failed to add writing material:', error);
    }
  };

  const deleteMaterial = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/materials/${id}`, { method: 'DELETE' });
      await fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  return (
    <div className="materials-page">
      <div className="page-header">
        <h2>Learning Materials</h2>
        <div className="header-actions">
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className={`btn-primary ${uploading ? 'disabled' : ''}`}>
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
          <button className="btn-secondary" onClick={() => setShowWritingForm(true)}>
            <Plus size={16} />
            Add Writing Material
          </button>
        </div>
      </div>

      {showWritingForm && (
        <div className="writing-form">
          <h3>Add Writing Material</h3>
          <input
            type="text"
            placeholder="Title"
            value={writingContent.title}
            onChange={(e) => setWritingContent({...writingContent, title: e.target.value})}
          />
          <select
            value={writingContent.category}
            onChange={(e) => setWritingContent({...writingContent, category: e.target.value})}
          >
            <option value="writing">Writing</option>
            <option value="grammar">Grammar</option>
            <option value="vocabulary">Vocabulary</option>
          </select>
          <textarea
            placeholder="Content"
            rows="8"
            value={writingContent.content}
            onChange={(e) => setWritingContent({...writingContent, content: e.target.value})}
          />
          <div className="form-actions">
            <button className="btn-primary" onClick={addWritingMaterial}>
              Add Material
            </button>
            <button className="btn-secondary" onClick={() => setShowWritingForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="materials-grid">
        {materials.map(material => (
          <div key={material.id} className="material-card">
            <div className="material-icon">
              {material.type === 'video' ? <Video size={32} /> : 
               material.type === 'writing' ? <FileText size={32} /> : <Volume2 size={32} />}
            </div>
            <div className="material-info">
              <h3>{material.title}</h3>
              <div className="material-meta">
                <span className={`type-badge ${material.type}`}>
                  {material.type}
                </span>
                {material.duration && <span className="duration">{material.duration}</span>}
              </div>
              <p className="upload-date">Uploaded: {material.uploadDate}</p>
            </div>
            <div className="material-actions">
              <button className="btn-icon" title="Preview">
                <Eye size={16} />
              </button>
              {material.type !== 'writing' && (
                <button className="btn-icon" title="Play">
                  <Play size={16} />
                </button>
              )}
              <button className="btn-icon delete" onClick={() => deleteMaterial(material.id)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningMaterials;
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import API_URL from '../config';

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    description: '',
    type: 'speaking', // pronunciation practice
    difficulty: 'beginner',
    dueDate: '',
    level: 'A1'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Component mounted, fetching prompts...');
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      console.log('Fetching prompts from NEW endpoint...');
      const response = await fetch(`${API_URL}/api/admin/get-prompts`);
      console.log('NEW endpoint response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('NEW endpoint response data:', data);

      if (data.success) {
        setPrompts(data.prompts || []);
      } else {
        console.error('API returned error:', data.error);
        setPrompts([]);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      setPrompts([]);
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.title || !newPrompt.description) return;

    setLoading(true);
    try {
      console.log('Sending prompt data to NEW endpoint:', newPrompt);
      const response = await fetch(`${API_URL}/api/admin/create-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt)
      });

      const result = await response.json();
      console.log('NEW endpoint response:', result);

      if (response.ok && result.success) {
        alert('Prompt added successfully to database!');
        await fetchPrompts();
        setNewPrompt({
          title: '',
          description: '',
          type: 'speaking', // pronunciation practice
          difficulty: 'beginner',
          dueDate: '',
          level: 'A1'
        });
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add prompt:', error);
      alert('Failed to add prompt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePrompt = async (id) => {
    try {
      await fetch(`${API_URL}/api/prompts/${id}`, { method: 'DELETE' });
      await fetchPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  return (
    <div className="prompts-page">
      <div className="page-header">
        <h2>Upload Prompts / Tasks</h2>
      </div>

      <div className="add-prompt-form">
        <h3>Add New Prompt</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Prompt Title"
            value={newPrompt.title}
            onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
          />
          <select
            value={newPrompt.type}
            onChange={(e) => setNewPrompt({ ...newPrompt, type: e.target.value })}
          >
            <option value="speaking">Pronunciation</option>
            <option value="writing">Writing</option>
          </select>
          <select
            value={newPrompt.difficulty}
            onChange={(e) => setNewPrompt({ ...newPrompt, difficulty: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={newPrompt.level}
            onChange={(e) => setNewPrompt({ ...newPrompt, level: e.target.value })}
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
          <input
            type="date"
            value={newPrompt.dueDate}
            onChange={(e) => setNewPrompt({ ...newPrompt, dueDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <textarea
          placeholder="Prompt Description"
          value={newPrompt.description}
          onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
          rows="3"
        />
        <button className="btn-primary" onClick={addPrompt} disabled={loading}>
          <Plus size={16} />
          {loading ? 'Adding...' : 'Add Prompt'}
        </button>
      </div>

      <div className="prompts-list">
        <h3>Existing Prompts ({prompts.length})</h3>
        {prompts.length === 0 ? (
          <p>No prompts found. Add a prompt above to get started.</p>
        ) : (
          <div>
            <p>Found {prompts.length} prompts:</p>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map(prompt => (
                  <tr key={prompt.id}>
                    <td>{prompt.title || 'No title'}</td>
                    <td>
                      <span className={`type-badge ${prompt.type}`}>
                        {prompt.type || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`difficulty-badge ${prompt.difficulty}`}>
                        {prompt.level || 'N/A'}
                      </span>
                    </td>
                    <td>{prompt.due_date ? new Date(prompt.due_date).toLocaleDateString() : 'No due date'}</td>
                    <td>
                      <button className="btn-icon delete" onClick={() => deletePrompt(prompt.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;
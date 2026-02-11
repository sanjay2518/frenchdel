import { useState, useEffect } from 'react';
import {
    Send, Users, Gift, Video, FileText, Lightbulb,
    BookOpen, MessageSquare, Search, CheckCircle,
    AlertCircle, Loader, X, Trash2, RefreshCw, Clock
} from 'lucide-react';

const SendResources = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Sent resources state
    const [sentResources, setSentResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'manage'

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'feedback',
        content: '',
        priority: 'normal'
    });

    // Resource types
    const resourceTypes = [
        { value: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} />, color: '#2563eb' },
        { value: 'tip', label: 'Learning Tip', icon: <Lightbulb size={18} />, color: '#d97706' },
        { value: 'video', label: 'Video Link', icon: <Video size={18} />, color: '#db2777' },
        { value: 'article', label: 'Article/Link', icon: <FileText size={18} />, color: '#4f46e5' },
        { value: 'exercise', label: 'Exercise', icon: <BookOpen size={18} />, color: '#059669' }
    ];

    // Fetch users list
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/admin/users-list');
                const data = await response.json();

                if (data.success) {
                    setUsers(data.users || []);
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Fetch all sent resources
    const fetchSentResources = async () => {
        setLoadingResources(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/resources/all');
            const data = await response.json();

            console.log('Fetch resources response:', data);

            if (data.success) {
                setSentResources(data.resources || []);
            } else if (data.error) {
                setError(data.error);
                setSentResources([]);
            }
        } catch (err) {
            console.error('Error fetching sent resources:', err);
            setError('Failed to connect to server. Make sure backend is running.');
        } finally {
            setLoadingResources(false);
        }
    };

    // Fetch resources when switching to manage tab
    useEffect(() => {
        if (activeTab === 'manage') {
            fetchSentResources();
        }
    }, [activeTab]);

    // Delete a resource
    const deleteResource = async (resourceId) => {
        setDeleting(true);
        try {
            const response = await fetch(`http://localhost:5000/api/resources/${resourceId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSuccess('Resource deleted successfully!');
                setTimeout(() => setSuccess(''), 3000);
                fetchSentResources();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete resource');
            }
        } catch (err) {
            console.error('Error deleting resource:', err);
            setError('Failed to delete resource');
        } finally {
            setDeleting(false);
            setDeleteConfirm(null);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Filter users based on search
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = (user.fullName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const username = (user.username || '').toLowerCase();

        return fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            username.includes(searchLower);
    });

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            setError('Please select a user');
            return;
        }

        if (!formData.title.trim()) {
            setError('Please enter a title');
            return;
        }

        setSending(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('http://localhost:5000/api/resources/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Resource sent to ${selectedUser.fullName} successfully!`);
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    type: 'feedback',
                    content: '',
                    priority: 'normal'
                });
                setSelectedUser(null);
            } else {
                setError(data.error || 'Failed to send resource');
            }
        } catch (err) {
            console.error('Error sending resource:', err);
            setError('Failed to send resource. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="admin-section">
            <div className="section-header">
                <div className="header-content">
                    <Gift size={24} />
                    <div>
                        <h2>Learning Resources</h2>
                        <p>Send and manage personalized feedback and learning materials</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="resources-tabs">
                <button
                    className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                    onClick={() => setActiveTab('send')}
                >
                    <Send size={16} />
                    Send New
                </button>
                <button
                    className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manage')}
                >
                    <Gift size={16} />
                    Manage Sent ({sentResources.length})
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="alert alert-success">
                    <CheckCircle size={18} />
                    {success}
                    <button onClick={() => setSuccess(null)} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Send New Resource Tab */}
            {activeTab === 'send' && (
                <div className="send-resources-container">
                    {/* User Selection */}
                    <div className="form-section">
                        <h3><Users size={18} /> Select User</h3>

                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <Loader className="spinner" size={24} />
                                <span>Loading users...</span>
                            </div>
                        ) : (
                            <div className="users-list">
                                {filteredUsers.length === 0 ? (
                                    <p className="empty-message">No users found</p>
                                ) : (
                                    filteredUsers.slice(0, 10).map(user => (
                                        <div
                                            key={user.id}
                                            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <div className="user-avatar">
                                                {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                            </div>
                                            <div className="user-info">
                                                <span className="user-name">{user.fullName}</span>
                                                <span className="user-email">{user.email}</span>
                                            </div>
                                            {selectedUser?.id === user.id && (
                                                <CheckCircle size={18} className="selected-icon" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resource Form */}
                    <form onSubmit={handleSubmit} className="resource-form">
                        <h3><Send size={18} /> Resource Details</h3>

                        {selectedUser && (
                            <div className="selected-user-badge">
                                Sending to: <strong>{selectedUser.fullName}</strong>
                            </div>
                        )}

                        {/* Resource Type */}
                        <div className="form-group">
                            <label>Resource Type</label>
                            <div className="type-options">
                                {resourceTypes.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        className={`type-btn ${formData.type === type.value ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: type.value })}
                                        style={{ '--type-color': type.color }}
                                    >
                                        {type.icon}
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="form-group">
                            <label htmlFor="title">Title *</label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Pronunciation Tips for Vowels"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <input
                                type="text"
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this resource"
                            />
                        </div>

                        {/* Content */}
                        <div className="form-group">
                            <label htmlFor="content">
                                {formData.type === 'video' || formData.type === 'article'
                                    ? 'URL / Link'
                                    : 'Content / Message'}
                            </label>
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={
                                    formData.type === 'video'
                                        ? 'https://youtube.com/watch?v=...'
                                        : formData.type === 'article'
                                            ? 'https://...'
                                            : 'Write your feedback, tip, or exercise instructions here...'
                                }
                                rows={5}
                            />
                        </div>

                        {/* Priority */}
                        <div className="form-group">
                            <label>Priority</label>
                            <div className="priority-options">
                                <label className={`priority-option ${formData.priority === 'low' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="priority"
                                        value="low"
                                        checked={formData.priority === 'low'}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    />
                                    <span className="priority-dot low"></span>
                                    Low
                                </label>
                                <label className={`priority-option ${formData.priority === 'normal' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="priority"
                                        value="normal"
                                        checked={formData.priority === 'normal'}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    />
                                    <span className="priority-dot normal"></span>
                                    Normal
                                </label>
                                <label className={`priority-option ${formData.priority === 'high' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="priority"
                                        value="high"
                                        checked={formData.priority === 'high'}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    />
                                    <span className="priority-dot high"></span>
                                    High
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={sending || !selectedUser}
                        >
                            {sending ? (
                                <>
                                    <Loader className="spinner" size={18} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send Resource
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Manage Sent Resources Tab */}
            {activeTab === 'manage' && (
                <div className="manage-resources-section">
                    <div className="manage-header">
                        <h3>Sent Resources</h3>
                        <button
                            className="btn-secondary"
                            onClick={fetchSentResources}
                            disabled={loadingResources}
                        >
                            <RefreshCw size={16} className={loadingResources ? 'spinning' : ''} />
                            Refresh
                        </button>
                    </div>

                    {loadingResources ? (
                        <div className="loading-state">
                            <Loader className="spinner" size={32} />
                            <span>Loading sent resources...</span>
                        </div>
                    ) : sentResources.length === 0 ? (
                        <div className="empty-resources">
                            <Gift size={48} />
                            <h4>No resources sent yet</h4>
                            <p>Resources you send to users will appear here</p>
                        </div>
                    ) : (
                        <div className="resources-list">
                            {sentResources.map(resource => (
                                <div key={resource.id} className="resource-item">
                                    <div className={`resource-type-icon ${resource.type}`}>
                                        {resource.type === 'feedback' && <MessageSquare size={18} />}
                                        {resource.type === 'tip' && <Lightbulb size={18} />}
                                        {resource.type === 'video' && <Video size={18} />}
                                        {resource.type === 'article' && <FileText size={18} />}
                                        {resource.type === 'exercise' && <BookOpen size={18} />}
                                    </div>
                                    <div className="resource-details">
                                        <div className="resource-title-row">
                                            <h4>{resource.title}</h4>
                                            <span className={`resource-badge ${resource.type}`}>{resource.type}</span>
                                            {resource.priority === 'high' && (
                                                <span className="priority-badge high">High Priority</span>
                                            )}
                                        </div>
                                        <p className="resource-recipient">
                                            To: <strong>{resource.userName || resource.userEmail || 'Unknown User'}</strong>
                                        </p>
                                        {resource.description && (
                                            <p className="resource-desc">{resource.description}</p>
                                        )}
                                        <div className="resource-meta">
                                            <span className="resource-date">
                                                <Clock size={12} />
                                                {formatDate(resource.createdAt)}
                                            </span>
                                            <span className={`read-status ${resource.isRead ? 'read' : 'unread'}`}>
                                                {resource.isRead ? '✓ Read' : '• Unread'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-delete"
                                        onClick={() => setDeleteConfirm(resource.id)}
                                        title="Delete resource"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-icon">
                            <Trash2 size={32} />
                        </div>
                        <h3>Delete Resource?</h3>
                        <p>Are you sure you want to delete this resource? The user will no longer be able to see it.</p>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => deleteResource(deleteConfirm)}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .send-resources-container {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 2rem;
                    margin-top: 1.5rem;
                }

                .form-section, .resource-form {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .form-section h3, .resource-form h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    color: #1f2937;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: #f3f4f6;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .search-box input {
                    flex: 1;
                    border: none;
                    background: none;
                    outline: none;
                    font-size: 0.9375rem;
                }

                .users-list {
                    max-height: 400px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .user-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .user-item:hover {
                    border-color: #10b981;
                }

                .user-item.selected {
                    border-color: #10b981;
                    background: #ecfdf5;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #14b8a6, #0891b2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                }

                .user-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 500;
                    color: #1f2937;
                }

                .user-email {
                    font-size: 0.8125rem;
                    color: #6b7280;
                }

                .selected-icon {
                    color: #10b981;
                }

                .selected-user-badge {
                    padding: 0.75rem 1rem;
                    background: #ecfdf5;
                    border-radius: 8px;
                    color: #059669;
                    margin-bottom: 1rem;
                    font-size: 0.9375rem;
                }

                .type-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .type-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 50px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .type-btn:hover {
                    border-color: var(--type-color);
                }

                .type-btn.active {
                    background: var(--type-color);
                    border-color: var(--type-color);
                    color: white;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #374151;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9375rem;
                    transition: border-color 0.2s;
                }

                .form-group input:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: #10b981;
                }

                .form-group textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .priority-options {
                    display: flex;
                    gap: 1rem;
                }

                .priority-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .priority-option input {
                    display: none;
                }

                .priority-option.selected {
                    border-color: #10b981;
                    background: #ecfdf5;
                }

                .priority-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .priority-dot.low {
                    background: #94a3b8;
                }

                .priority-dot.normal {
                    background: #10b981;
                }

                .priority-dot.high {
                    background: #ef4444;
                }

                .btn-block {
                    width: 100%;
                    justify-content: center;
                }

                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 2rem;
                    color: #6b7280;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .empty-message {
                    text-align: center;
                    color: #9ca3af;
                    padding: 2rem;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .alert-success {
                    background: #d1fae5;
                    color: #065f46;
                }

                .alert-error {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .alert-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    opacity: 0.6;
                }

                .alert-close:hover {
                    opacity: 1;
                }

                @media (max-width: 768px) {
                    .send-resources-container {
                        grid-template-columns: 1fr;
                    }
                }

                /* Tab Navigation */
                .resources-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 0;
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: #6b7280;
                    transition: all 0.2s;
                    margin-bottom: -2px;
                }

                .tab-btn:hover {
                    color: #10b981;
                }

                .tab-btn.active {
                    color: #10b981;
                    border-bottom-color: #10b981;
                }

                /* Manage Resources Section */
                .manage-resources-section {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .manage-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .manage-header h3 {
                    font-size: 1.125rem;
                    color: #1f2937;
                    margin: 0;
                }

                .btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    color: #6b7280;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    border-color: #10b981;
                    color: #10b981;
                }

                /* Resources List */
                .resources-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .resource-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    transition: all 0.2s;
                }

                .resource-item:hover {
                    background: #f3f4f6;
                }

                .resource-type-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    flex-shrink: 0;
                }

                .resource-type-icon.feedback {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .resource-type-icon.tip {
                    background: #fef3c7;
                    color: #d97706;
                }

                .resource-type-icon.video {
                    background: #fce7f3;
                    color: #db2777;
                }

                .resource-type-icon.article {
                    background: #e0e7ff;
                    color: #4f46e5;
                }

                .resource-type-icon.exercise {
                    background: #d1fae5;
                    color: #059669;
                }

                .resource-details {
                    flex: 1;
                    min-width: 0;
                }

                .resource-title-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.25rem;
                }

                .resource-title-row h4 {
                    font-size: 1rem;
                    color: #1f2937;
                    margin: 0;
                }

                .resource-badge {
                    padding: 0.125rem 0.5rem;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    border-radius: 50px;
                }

                .resource-badge.feedback { background: #dbeafe; color: #2563eb; }
                .resource-badge.tip { background: #fef3c7; color: #d97706; }
                .resource-badge.video { background: #fce7f3; color: #db2777; }
                .resource-badge.article { background: #e0e7ff; color: #4f46e5; }
                .resource-badge.exercise { background: #d1fae5; color: #059669; }

                .priority-badge.high {
                    background: #fee2e2;
                    color: #dc2626;
                    padding: 0.125rem 0.5rem;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    border-radius: 50px;
                }

                .resource-recipient {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0.25rem 0;
                }

                .resource-desc {
                    font-size: 0.875rem;
                    color: #4b5563;
                    margin: 0.25rem 0;
                }

                .resource-meta {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .resource-date {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .read-status {
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .read-status.read { color: #10b981; }
                .read-status.unread { color: #f59e0b; }

                .btn-delete {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #9ca3af;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .btn-delete:hover {
                    background: #fee2e2;
                    border-color: #fecaca;
                    color: #dc2626;
                }

                /* Empty State */
                .empty-resources {
                    text-align: center;
                    padding: 3rem;
                    color: #9ca3af;
                }

                .empty-resources svg {
                    margin-bottom: 1rem;
                }

                .empty-resources h4 {
                    color: #6b7280;
                    margin-bottom: 0.5rem;
                }

                /* Delete Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .delete-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }

                .delete-icon {
                    width: 64px;
                    height: 64px;
                    background: #fee2e2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #dc2626;
                    margin: 0 auto 1rem;
                }

                .delete-modal h3 {
                    font-size: 1.25rem;
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                }

                .delete-modal p {
                    color: #6b7280;
                    margin-bottom: 1.5rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-danger {
                    background: #dc2626;
                    color: white;
                    border: none;
                }

                .btn-danger:hover {
                    background: #b91c1c;
                }

                .btn-danger:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default SendResources;

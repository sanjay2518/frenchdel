import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, MessageSquare, Video, FileText, Lightbulb,
    ArrowLeft, Check, ExternalLink, Clock, Star,
    AlertCircle, RefreshCw, Inbox
} from 'lucide-react';
import './Resources.css';

const Resources = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    // Fetch user resources
    const fetchResources = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:5000/api/resources/user/${user.id}`);
            const data = await response.json();

            if (data.success) {
                setResources(data.resources || []);
            } else {
                setError(data.error || 'Failed to load resources');
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
            setError('Unable to load resources. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [user?.id]);

    // Mark resource as read
    const markAsRead = async (resourceId) => {
        try {
            await fetch(`http://localhost:5000/api/resources/${resourceId}/read`, {
                method: 'PUT'
            });

            setResources(resources.map(r =>
                r.id === resourceId ? { ...r, isRead: true } : r
            ));
        } catch (err) {
            console.error('Error marking resource as read:', err);
        }
    };

    // Get icon based on resource type
    const getResourceIcon = (type) => {
        switch (type) {
            case 'feedback':
                return <MessageSquare size={20} />;
            case 'video':
                return <Video size={20} />;
            case 'article':
                return <FileText size={20} />;
            case 'tip':
                return <Lightbulb size={20} />;
            case 'exercise':
                return <BookOpen size={20} />;
            default:
                return <MessageSquare size={20} />;
        }
    };

    // Get color based on priority
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'priority-high';
            case 'normal':
                return 'priority-normal';
            case 'low':
                return 'priority-low';
            default:
                return 'priority-normal';
        }
    };

    // Filter resources
    const filteredResources = filter === 'all'
        ? resources
        : filter === 'unread'
            ? resources.filter(r => !r.isRead)
            : resources.filter(r => r.type === filter);

    const unreadCount = resources.filter(r => !r.isRead).length;

    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="resources-page">
            <div className="resources-container">
                {/* Header */}
                <div className="resources-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="resources-title-section">
                        <h1>My Learning Resources</h1>
                        <p>Personalized feedback and materials from your instructors</p>
                    </div>
                    <div className="resources-header-actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={fetchResources}
                            disabled={loading}
                        >
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                            Refresh
                        </button>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount} new</span>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="resources-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({resources.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'feedback' ? 'active' : ''}`}
                        onClick={() => setFilter('feedback')}
                    >
                        <MessageSquare size={14} /> Feedback
                    </button>
                    <button
                        className={`filter-btn ${filter === 'tip' ? 'active' : ''}`}
                        onClick={() => setFilter('tip')}
                    >
                        <Lightbulb size={14} /> Tips
                    </button>
                    <button
                        className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
                        onClick={() => setFilter('video')}
                    >
                        <Video size={14} /> Videos
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="resources-loading">
                        <RefreshCw className="spinner" size={40} />
                        <p>Loading your resources...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="resources-error">
                        <AlertCircle size={40} />
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchResources}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredResources.length === 0 && (
                    <div className="resources-empty">
                        <div className="empty-icon">
                            <Inbox size={48} />
                        </div>
                        <h3>No resources yet</h3>
                        <p>Your instructors haven't shared any personalized resources with you yet. Keep practicing and check back later!</p>
                        <Link to="/practice" className="btn btn-primary">
                            Continue Practice
                        </Link>
                    </div>
                )}

                {/* Resources List */}
                {!loading && !error && filteredResources.length > 0 && (
                    <div className="resources-list">
                        {filteredResources.map((resource, index) => (
                            <div
                                key={resource.id}
                                className={`resource-card ${resource.isRead ? 'read' : 'unread'} ${getPriorityColor(resource.priority)}`}
                                style={{ '--delay': `${index * 0.05}s` }}
                                onClick={() => !resource.isRead && markAsRead(resource.id)}
                            >
                                <div className={`resource-icon ${resource.type}`}>
                                    {getResourceIcon(resource.type)}
                                </div>

                                <div className="resource-content">
                                    <div className="resource-header">
                                        <div className="resource-title-row">
                                            {!resource.isRead && <span className="unread-dot"></span>}
                                            <h3>{resource.title}</h3>
                                            <span className={`resource-type-badge ${resource.type}`}>
                                                {resource.type}
                                            </span>
                                        </div>
                                        <span className="resource-date">
                                            <Clock size={12} />
                                            {formatDate(resource.createdAt)}
                                        </span>
                                    </div>

                                    {resource.description && (
                                        <p className="resource-description">{resource.description}</p>
                                    )}

                                    {resource.content && (
                                        <div className="resource-body">
                                            {resource.type === 'video' || resource.content.startsWith('http') ? (
                                                <a
                                                    href={resource.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="resource-link"
                                                >
                                                    <ExternalLink size={14} />
                                                    Open Resource
                                                </a>
                                            ) : (
                                                <p className="resource-text">{resource.content}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="resource-action">
                                    {resource.isRead ? (
                                        <span className="read-indicator">
                                            <Check size={16} /> Read
                                        </span>
                                    ) : (
                                        <span className="priority-indicator">
                                            {resource.priority === 'high' && <Star size={14} />}
                                            {resource.priority === 'high' ? 'Important' : 'New'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Resources;

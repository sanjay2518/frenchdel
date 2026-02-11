import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Mic, PenTool, Clock, CheckCircle,
    ArrowLeft, MessageSquare, Award,
    ChevronDown, ChevronUp, Calendar,
    Inbox, Star
} from 'lucide-react';
import './MySubmissions.css';

const MySubmissions = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchSubmissions();
        }
    }, [user]);

    const fetchSubmissions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/user/submissions/${user.id}`);
            const data = await response.json();
            if (data.success) {
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true;
        if (filter === 'pending') return sub.status === 'pending';
        if (filter === 'reviewed') return sub.status === 'reviewed';
        if (filter === 'speaking') return sub.type === 'speaking';
        if (filter === 'writing') return sub.type === 'writing';
        return true;
    });

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        return 'needs-work';
    };

    if (loading) {
        return (
            <div className="my-submissions-page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-submissions-page">
            <div className="submissions-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <Link to="/dashboard" className="back-link">
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <h1>My Submissions</h1>
                        <p>View your practice submissions and feedback from instructors</p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="stats-summary">
                    <div className="stat-item">
                        <div className="stat-icon total">
                            <Inbox size={20} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-value">{submissions.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon reviewed">
                            <CheckCircle size={20} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-value">{submissions.filter(s => s.status === 'reviewed').length}</span>
                            <span className="stat-label">Reviewed</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon pending">
                            <Clock size={20} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-value">{submissions.filter(s => s.status === 'pending').length}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon speaking">
                            <Mic size={20} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-value">{submissions.filter(s => s.type === 'speaking').length}</span>
                            <span className="stat-label">Speaking</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon writing">
                            <PenTool size={20} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-value">{submissions.filter(s => s.type === 'writing').length}</span>
                            <span className="stat-label">Writing</span>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'reviewed' ? 'active' : ''}`}
                        onClick={() => setFilter('reviewed')}
                    >
                        <CheckCircle size={16} /> Reviewed
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        <Clock size={16} /> Pending
                    </button>
                    <button
                        className={`filter-btn ${filter === 'speaking' ? 'active' : ''}`}
                        onClick={() => setFilter('speaking')}
                    >
                        <Mic size={16} /> Speaking
                    </button>
                    <button
                        className={`filter-btn ${filter === 'writing' ? 'active' : ''}`}
                        onClick={() => setFilter('writing')}
                    >
                        <PenTool size={16} /> Writing
                    </button>
                </div>

                {/* Submissions List */}
                <div className="submissions-list">
                    {filteredSubmissions.length === 0 ? (
                        <div className="empty-state">
                            <Inbox size={64} />
                            <h3>No submissions found</h3>
                            <p>
                                {filter === 'all'
                                    ? "You haven't made any submissions yet. Start practicing to see your progress!"
                                    : `No ${filter} submissions found.`}
                            </p>
                            <Link to="/practice" className="btn btn-primary">
                                Start Practicing
                            </Link>
                        </div>
                    ) : (
                        filteredSubmissions.map(submission => (
                            <div
                                key={submission.id}
                                className={`submission-card ${submission.status} ${expandedId === submission.id ? 'expanded' : ''}`}
                            >
                                <div
                                    className="submission-header"
                                    onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
                                >
                                    <div className="submission-icon">
                                        {submission.type === 'speaking' ? (
                                            <Mic size={24} />
                                        ) : (
                                            <PenTool size={24} />
                                        )}
                                    </div>
                                    <div className="submission-info">
                                        <h3>{submission.title}</h3>
                                        <div className="submission-meta">
                                            <span className={`type-badge ${submission.type}`}>
                                                {submission.type}
                                            </span>
                                            <span className="submission-date">
                                                <Calendar size={14} />
                                                {getTimeAgo(submission.submittedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="submission-status-section">
                                        {submission.status === 'reviewed' ? (
                                            <div className="score-badge">
                                                <Award size={18} />
                                                <span className={`score ${getScoreColor(submission.score)}`}>
                                                    {submission.score}/100
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="status-badge pending">
                                                <Clock size={16} />
                                                Awaiting Review
                                            </div>
                                        )}
                                        <button className="expand-btn">
                                            {expandedId === submission.id ? (
                                                <ChevronUp size={20} />
                                            ) : (
                                                <ChevronDown size={20} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {expandedId === submission.id && (
                                    <div className="submission-details">
                                        {submission.status === 'reviewed' && submission.feedback ? (
                                            <div className="feedback-section">
                                                <div className="feedback-header">
                                                    <MessageSquare size={20} />
                                                    <h4>Instructor Feedback</h4>
                                                </div>
                                                <div className="feedback-content">
                                                    <div className="score-display">
                                                        <div className={`score-circle ${getScoreColor(submission.score)}`}>
                                                            <Star size={24} />
                                                            <span>{submission.score}</span>
                                                        </div>
                                                        <span className="score-label">
                                                            {submission.score >= 80 ? 'Excellent!' :
                                                                submission.score >= 60 ? 'Good work!' :
                                                                    submission.score >= 40 ? 'Keep practicing!' :
                                                                        'Needs improvement'}
                                                        </span>
                                                    </div>
                                                    <div className="feedback-text">
                                                        <p>{submission.feedback}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pending-feedback">
                                                <Clock size={32} />
                                                <h4>Feedback Pending</h4>
                                                <p>Your submission is being reviewed by our instructors. You'll receive feedback soon!</p>
                                            </div>
                                        )}

                                        {/* Show submission content */}
                                        {submission.type === 'writing' && submission.submissionText && (
                                            <div className="submission-content">
                                                <h4>Your Submission</h4>
                                                <div className="content-preview">
                                                    {submission.submissionText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MySubmissions;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import {
    Mic, PenTool, Clock, CheckCircle,
    TrendingUp, ArrowRight, Calendar,
    FileText, Award, Inbox, Target
} from 'lucide-react';
import Onboarding from '../components/Onboarding';
import './Dashboard.css';

const Dashboard = () => {
    const { user, updateSubscription } = useAuth();
    const { getStats, getRecentSubmissions, getTimeAgo, loading, receiveFeedback } = useUserData();

    // Check if user has seen onboarding
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const onboardingCompleted = localStorage.getItem('onboardingCompleted');
        if (!onboardingCompleted) {
            setShowOnboarding(true);
        }
    }, []);

    const stats = getStats();
    const recentSubmissions = getRecentSubmissions(4);

    // Calculate progress (based on submissions vs a goal of 20)
    const progressGoal = 20;
    const progressPercent = Math.min(Math.round((stats.totalSubmissions / progressGoal) * 100), 100);

    // Demo functions for testing new features
    const simulateFeedback = () => {
        if (recentSubmissions.length > 0) {
            const pendingSubmission = recentSubmissions.find(s => s.status === 'pending');
            if (pendingSubmission) {
                receiveFeedback(pendingSubmission.id, 85, 'Great work! Your pronunciation is improving.');
            }
        }
    };

    const simulateUpgrade = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/subscription/update-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    plan_type: 'premium',
                    payment_token: 'demo_token_123'
                })
            });

            if (response.ok) {
                const result = await response.json();
                updateSubscription(result.subscription);
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
        }
    };
    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Onboarding for first-time users */}
            {showOnboarding && (
                <Onboarding
                    userName={user?.firstName}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}

            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="welcome-section">
                        <h1>Bonjour, {user?.firstName || 'Learner'}! 👋</h1>
                        <p>Ready to continue your French learning journey?</p>
                    </div>
                    <div className="header-actions">
                        <Link to="/practice" className="btn btn-primary">
                            Start Practice <ArrowRight size={18} />
                        </Link>
                        {/* Demo buttons - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={simulateFeedback} className="btn btn-secondary btn-sm">
                                    Test Email
                                </button>
                                <button onClick={simulateUpgrade} className="btn btn-secondary btn-sm">
                                    Test Upgrade
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <FileText size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalSubmissions}</span>
                            <span className="stat-label">Total Submissions</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <Mic size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.speakingSubmissions}</span>
                            <span className="stat-label">Speaking Sessions</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon pink">
                            <PenTool size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.writingSubmissions}</span>
                            <span className="stat-label">Writing Sessions</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.pendingFeedback}</span>
                            <span className="stat-label">Awaiting Feedback</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="dashboard-content-grid">
                    {/* Main Content */}
                    <div className="dashboard-main-content">
                        {/* Quick Actions */}
                        <div className="quick-actions-card">
                            <h3>Quick Actions</h3>
                            <div className="quick-actions-grid">
                                <Link to="/practice/speaking" className="quick-action-item">
                                    <div className="action-icon speaking">
                                        <Mic size={28} />
                                    </div>
                                    <span>Speaking Practice</span>
                                </Link>
                                <Link to="/practice/writing" className="quick-action-item">
                                    <div className="action-icon writing">
                                        <PenTool size={28} />
                                    </div>
                                    <span>Writing Practice</span>
                                </Link>
                            </div>
                        </div>

                        {/* Practice Prompts Card */}
                        <div className="practice-prompts-card">
                            <div className="card-header">
                                <h3>Practice Prompts</h3>
                                <Link to="/practice-prompts" className="view-all">
                                    View All <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="prompt-preview">
                                <div className="prompt-icon">
                                    <Target size={24} />
                                </div>
                                <div className="prompt-content">
                                    <h4>Today's Challenge</h4>
                                    <p>Complete admin-assigned tasks to improve your French skills</p>
                                </div>
                                <Link to="/practice-prompts" className="btn btn-primary btn-sm">
                                    Start Task
                                </Link>
                            </div>
                        </div>

                        {/* Recent Submissions */}
                        <div className="recent-submissions-card">
                            <div className="card-header">
                                <h3>Recent Submissions</h3>
                                {recentSubmissions.length > 0 && (
                                    <Link to="/dashboard/submissions" className="view-all">
                                        View All <ArrowRight size={16} />
                                    </Link>
                                )}
                            </div>

                            {recentSubmissions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <Inbox size={48} />
                                    </div>
                                    <h4>No submissions yet</h4>
                                    <p>Start practicing to see your submissions here!</p>
                                    <Link to="/practice" className="btn btn-primary btn-sm">
                                        Start Your First Practice
                                    </Link>
                                </div>
                            ) : (
                                <div className="submissions-list">
                                    {recentSubmissions.map((submission) => (
                                        <div key={submission.id} className="submission-item">
                                            <div className="submission-icon">
                                                {submission.type === 'speaking' ? (
                                                    <Mic size={18} />
                                                ) : (
                                                    <PenTool size={18} />
                                                )}
                                            </div>
                                            <div className="submission-info">
                                                <h4>{submission.title}</h4>
                                                <span className="submission-time">
                                                    <Calendar size={14} /> {getTimeAgo(submission.submittedAt)}
                                                </span>
                                            </div>
                                            <div className="submission-status">
                                                {submission.status === 'reviewed' ? (
                                                    <div className="status-badge reviewed">
                                                        <CheckCircle size={14} />
                                                        <span>Score: {submission.score}</span>
                                                    </div>
                                                ) : (
                                                    <div className="status-badge pending">
                                                        <Clock size={14} />
                                                        <span>Pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress & Info */}
                    <div className="sidebar-cards">
                        {/* Progress Card */}
                        <div className="progress-card">
                            <h3>Your Progress</h3>
                            <div className="progress-ring-container">
                                <svg className="progress-ring" viewBox="0 0 120 120">
                                    <circle
                                        className="progress-ring-bg"
                                        cx="60"
                                        cy="60"
                                        r="52"
                                    />
                                    <circle
                                        className="progress-ring-fill"
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        strokeDasharray="326.7"
                                        strokeDashoffset={326.7 - (326.7 * progressPercent / 100)}
                                    />
                                </svg>
                                <div className="progress-value">
                                    <span className="value">{progressPercent}%</span>
                                    <span className="label">Goal</span>
                                </div>
                            </div>
                            <div className="progress-stats">
                                <div className="progress-stat">
                                    <TrendingUp size={16} />
                                    <span>{stats.totalSubmissions} of {progressGoal} submissions</span>
                                </div>
                            </div>
                        </div>

                        {/* Getting Started Card */}
                        {stats.totalSubmissions === 0 && (
                            <div className="getting-started-card">
                                <h3>Getting Started</h3>
                                <div className="steps-list">
                                    <div className="step-item">
                                        <span className="step-number">1</span>
                                        <span>Choose Speaking or Writing practice</span>
                                    </div>
                                    <div className="step-item">
                                        <span className="step-number">2</span>
                                        <span>Select a prompt that interests you</span>
                                    </div>
                                    <div className="step-item">
                                        <span className="step-number">3</span>
                                        <span>Record or write your response</span>
                                    </div>
                                    <div className="step-item">
                                        <span className="step-number">4</span>
                                        <span>Submit and receive feedback</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Info */}
                        <div className="account-card">
                            <div className="account-header">
                                <Award size={24} />
                                <span>{user?.subscription?.type?.charAt(0).toUpperCase() + user?.subscription?.type?.slice(1) || 'Free'} Account</span>
                            </div>
                            <p>Member since {new Date(user?.id || Date.now()).toLocaleDateString()}</p>
                            {user?.subscription?.type === 'premium' ? (
                                <div className="subscription-status">
                                    <span className="status-active">Active until {new Date(user.subscription.expiresAt).toLocaleDateString()}</span>
                                </div>
                            ) : (
                                <Link to="/pricing" className="btn btn-primary btn-sm">
                                    Upgrade to Premium
                                </Link>
                            )}
                            <Link to="/contact" className="btn btn-secondary btn-sm">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
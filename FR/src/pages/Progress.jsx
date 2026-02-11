import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import {
    TrendingUp, Award, Target, Calendar,
    Mic, PenTool, CheckCircle, Clock,
    ArrowLeft, Flame, Star, BookOpen,
    BarChart3, Zap, Trophy
} from 'lucide-react';
import './Progress.css';

const Progress = () => {
    const { user } = useAuth();
    const { getStats, getRecentSubmissions } = useUserData();
    const [timeRange, setTimeRange] = useState('week');

    const stats = getStats();
    const recentSubmissions = getRecentSubmissions(10);

    // Calculate streak (simulated - would come from backend in production)
    const currentStreak = Math.min(stats.totalSubmissions, 7);
    const longestStreak = Math.max(currentStreak, 12);

    // Calculate weekly progress
    const weeklyGoal = 5;
    const weeklyProgress = Math.min(stats.totalSubmissions, weeklyGoal);
    const weeklyPercentage = Math.round((weeklyProgress / weeklyGoal) * 100);

    // Skill breakdown
    const speakingScore = stats.speakingSubmissions > 0 ? Math.min(85, 60 + stats.speakingSubmissions * 5) : 0;
    const writingScore = stats.writingSubmissions > 0 ? Math.min(90, 55 + stats.writingSubmissions * 7) : 0;

    // Achievements
    const achievements = [
        {
            id: 'first-steps',
            title: 'First Steps',
            description: 'Complete your first practice session',
            icon: <Star size={24} />,
            unlocked: stats.totalSubmissions >= 1,
            progress: Math.min(stats.totalSubmissions, 1),
            total: 1
        },
        {
            id: 'speaker',
            title: 'French Speaker',
            description: 'Complete 5 speaking practices',
            icon: <Mic size={24} />,
            unlocked: stats.speakingSubmissions >= 5,
            progress: Math.min(stats.speakingSubmissions, 5),
            total: 5
        },
        {
            id: 'writer',
            title: 'French Writer',
            description: 'Complete 5 writing practices',
            icon: <PenTool size={24} />,
            unlocked: stats.writingSubmissions >= 5,
            progress: Math.min(stats.writingSubmissions, 5),
            total: 5
        },
        {
            id: 'streak-3',
            title: 'On Fire',
            description: 'Maintain a 3-day streak',
            icon: <Flame size={24} />,
            unlocked: currentStreak >= 3,
            progress: Math.min(currentStreak, 3),
            total: 3
        },
        {
            id: 'streak-7',
            title: 'Week Warrior',
            description: 'Maintain a 7-day streak',
            icon: <Trophy size={24} />,
            unlocked: currentStreak >= 7,
            progress: Math.min(currentStreak, 7),
            total: 7
        },
        {
            id: 'dedicated',
            title: 'Dedicated Learner',
            description: 'Complete 20 total practices',
            icon: <Target size={24} />,
            unlocked: stats.totalSubmissions >= 20,
            progress: Math.min(stats.totalSubmissions, 20),
            total: 20
        }
    ];

    const unlockedAchievements = achievements.filter(a => a.unlocked).length;

    // Week days for activity chart
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityData = weekDays.map((day, i) => ({
        day,
        count: Math.floor(Math.random() * 3) // Simulated - would come from backend
    }));

    return (
        <div className="progress-page">
            <div className="progress-container">
                {/* Header */}
                <div className="progress-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="progress-title-section">
                        <h1>Your Progress</h1>
                        <p>Track your French learning journey</p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="stats-overview">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <Flame size={28} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{currentStreak}</span>
                            <span className="stat-label">Day Streak</span>
                        </div>
                        <div className="stat-badge">
                            Best: {longestStreak} days
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <BookOpen size={28} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalSubmissions}</span>
                            <span className="stat-label">Total Practices</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <CheckCircle size={28} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.completedFeedback}</span>
                            <span className="stat-label">Reviewed</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Award size={28} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{unlockedAchievements}/{achievements.length}</span>
                            <span className="stat-label">Achievements</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="progress-grid">
                    {/* Weekly Goal */}
                    <div className="progress-card weekly-goal-card">
                        <div className="card-header">
                            <h3><Target size={20} /> Weekly Goal</h3>
                            <span className="goal-badge">{weeklyProgress}/{weeklyGoal} sessions</span>
                        </div>
                        <div className="weekly-progress">
                            <div className="progress-ring">
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        className="progress-ring-bg"
                                        cx="50"
                                        cy="50"
                                        r="42"
                                    />
                                    <circle
                                        className="progress-ring-fill"
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        strokeDasharray={`${weeklyPercentage * 2.64} 264`}
                                        role="progressbar"
                                        aria-valuenow={weeklyPercentage}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </svg>
                                <div className="progress-value">
                                    <span className="value">{weeklyPercentage}%</span>
                                    <span className="label">complete</span>
                                </div>
                            </div>
                            <div className="weekly-days">
                                {weekDays.map((day, i) => (
                                    <div
                                        key={day}
                                        className={`day-indicator ${activityData[i].count > 0 ? 'active' : ''}`}
                                        aria-label={`${day}: ${activityData[i].count} sessions`}
                                    >
                                        <span className="day-name">{day}</span>
                                        <div className="day-dots">
                                            {[...Array(3)].map((_, j) => (
                                                <span
                                                    key={j}
                                                    className={`dot ${j < activityData[i].count ? 'filled' : ''}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="progress-card skill-breakdown-card">
                        <div className="card-header">
                            <h3><BarChart3 size={20} /> Skill Breakdown</h3>
                        </div>
                        <div className="skills-list">
                            <div className="skill-item">
                                <div className="skill-header">
                                    <div className="skill-icon speaking">
                                        <Mic size={18} />
                                    </div>
                                    <span className="skill-name">Speaking</span>
                                    <span className="skill-score">{speakingScore}%</span>
                                </div>
                                <div className="skill-bar">
                                    <div
                                        className="skill-fill speaking"
                                        style={{ width: `${speakingScore}%` }}
                                        role="progressbar"
                                        aria-valuenow={speakingScore}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </div>
                                <div className="skill-stats">
                                    <span>{stats.speakingSubmissions} sessions completed</span>
                                </div>
                            </div>

                            <div className="skill-item">
                                <div className="skill-header">
                                    <div className="skill-icon writing">
                                        <PenTool size={18} />
                                    </div>
                                    <span className="skill-name">Writing</span>
                                    <span className="skill-score">{writingScore}%</span>
                                </div>
                                <div className="skill-bar">
                                    <div
                                        className="skill-fill writing"
                                        style={{ width: `${writingScore}%` }}
                                        role="progressbar"
                                        aria-valuenow={writingScore}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </div>
                                <div className="skill-stats">
                                    <span>{stats.writingSubmissions} sessions completed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="progress-card achievements-card">
                        <div className="card-header">
                            <h3><Trophy size={20} /> Achievements</h3>
                            <span className="achievement-count">{unlockedAchievements} unlocked</span>
                        </div>
                        <div className="achievements-grid">
                            {achievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                                    aria-label={`${achievement.title}: ${achievement.unlocked ? 'Unlocked' : 'Locked'}`}
                                >
                                    <div className="achievement-icon">
                                        {achievement.icon}
                                    </div>
                                    <div className="achievement-info">
                                        <h4>{achievement.title}</h4>
                                        <p>{achievement.description}</p>
                                        {!achievement.unlocked && (
                                            <div className="achievement-progress">
                                                <div className="mini-progress-bar">
                                                    <div
                                                        className="mini-progress-fill"
                                                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                                                    />
                                                </div>
                                                <span>{achievement.progress}/{achievement.total}</span>
                                            </div>
                                        )}
                                    </div>
                                    {achievement.unlocked && (
                                        <div className="achievement-badge">
                                            <CheckCircle size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="progress-card activity-card">
                        <div className="card-header">
                            <h3><Clock size={20} /> Recent Activity</h3>
                            <Link to="/dashboard/submissions" className="view-all-link">
                                View All
                            </Link>
                        </div>
                        {recentSubmissions.length === 0 ? (
                            <div className="empty-activity">
                                <BookOpen size={40} />
                                <p>No activity yet. Start practicing to see your progress!</p>
                                <Link to="/practice" className="btn btn-primary">
                                    Start Practice
                                </Link>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {recentSubmissions.slice(0, 5).map((submission, index) => (
                                    <div key={submission.id} className="activity-item">
                                        <div className={`activity-icon ${submission.type}`}>
                                            {submission.type === 'speaking' ? <Mic size={16} /> : <PenTool size={16} />}
                                        </div>
                                        <div className="activity-info">
                                            <span className="activity-title">{submission.title}</span>
                                            <span className="activity-date">
                                                <Calendar size={12} />
                                                {new Date(submission.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={`activity-status ${submission.status}`}>
                                            {submission.status === 'reviewed' ? (
                                                <>
                                                    <CheckCircle size={14} />
                                                    <span>Score: {submission.score}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={14} />
                                                    <span>Pending</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Motivation Banner */}
                <div className="motivation-banner">
                    <div className="motivation-content">
                        <Zap size={32} />
                        <div>
                            <h3>Keep the momentum going!</h3>
                            <p>You're making great progress. Complete one more session today to maintain your streak.</p>
                        </div>
                    </div>
                    <Link to="/practice" className="btn btn-primary btn-lg">
                        Continue Learning
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Progress;

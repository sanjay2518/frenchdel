import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, Lock, CheckCircle, ChevronRight,
    Star, Clock, Award, ArrowLeft, Loader,
    GraduationCap, Target, Zap, Mic, PenTool,
    AlertCircle, RefreshCw
} from 'lucide-react';
import './Lessons.css';

const Lessons = () => {
    const { user } = useAuth();
    const [activeLevel, setActiveLevel] = useState('beginner');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lessons, setLessons] = useState({
        beginner: [],
        intermediate: [],
        advanced: []
    });
    const [lessonCounts, setLessonCounts] = useState({
        beginner: 0,
        intermediate: 0,
        advanced: 0
    });

    // Level configuration
    const levelConfig = {
        beginner: {
            title: 'Beginner',
            subtitle: 'Build your foundation',
            description: 'Start your French journey with basic vocabulary, greetings, and simple sentences.',
            icon: <GraduationCap size={24} />,
            color: '#10b981'
        },
        intermediate: {
            title: 'Intermediate',
            subtitle: 'Expand your skills',
            description: 'Build on your foundation with more complex grammar and everyday conversations.',
            icon: <Target size={24} />,
            color: '#f59e0b'
        },
        advanced: {
            title: 'Advanced',
            subtitle: 'Master the language',
            description: 'Perfect your French with advanced grammar, idioms, and cultural nuances.',
            icon: <Zap size={24} />,
            color: '#ef4444'
        }
    };

    // Fetch lessons for a specific difficulty level
    const fetchLessonsByDifficulty = async (difficulty) => {
        try {
            const response = await fetch(`http://localhost:5000/api/prompts/difficulty/${difficulty}`);
            const data = await response.json();

            if (data.success) {
                return data.lessons || [];
            } else {
                console.error(`Error fetching ${difficulty} lessons:`, data.error);
                return [];
            }
        } catch (err) {
            console.error(`Error fetching ${difficulty} lessons:`, err);
            return [];
        }
    };

    // Fetch all lessons on component mount
    useEffect(() => {
        const fetchAllLessons = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch lessons for all difficulty levels in parallel
                const [beginnerLessons, intermediateLessons, advancedLessons] = await Promise.all([
                    fetchLessonsByDifficulty('beginner'),
                    fetchLessonsByDifficulty('intermediate'),
                    fetchLessonsByDifficulty('advanced')
                ]);

                setLessons({
                    beginner: beginnerLessons,
                    intermediate: intermediateLessons,
                    advanced: advancedLessons
                });

                setLessonCounts({
                    beginner: beginnerLessons.length,
                    intermediate: intermediateLessons.length,
                    advanced: advancedLessons.length
                });

            } catch (err) {
                console.error('Error fetching lessons:', err);
                setError('Unable to load lessons. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllLessons();
    }, []);

    // Calculate progress (placeholder - would need actual completion tracking)
    const calculateProgress = (level) => {
        const levelLessons = lessons[level] || [];
        if (levelLessons.length === 0) return 0;
        // For now, return 0% - would need completion tracking from backend
        const completed = levelLessons.filter(l => l.completed).length;
        return Math.round((completed / levelLessons.length) * 100);
    };

    // Get total XP earned
    const getTotalXP = () => {
        let total = 0;
        Object.values(lessons).forEach(levelLessons => {
            levelLessons.forEach(lesson => {
                if (lesson.completed) total += lesson.xp || 0;
            });
        });
        return total;
    };

    // Get icon based on lesson type
    const getLessonIcon = (type) => {
        switch (type) {
            case 'speaking':
                return <Mic size={18} />;
            case 'writing':
                return <PenTool size={18} />;
            default:
                return <BookOpen size={18} />;
        }
    };

    // Refresh lessons
    const handleRefresh = async () => {
        setLoading(true);
        setError(null);

        try {
            const [beginnerLessons, intermediateLessons, advancedLessons] = await Promise.all([
                fetchLessonsByDifficulty('beginner'),
                fetchLessonsByDifficulty('intermediate'),
                fetchLessonsByDifficulty('advanced')
            ]);

            setLessons({
                beginner: beginnerLessons,
                intermediate: intermediateLessons,
                advanced: advancedLessons
            });

            setLessonCounts({
                beginner: beginnerLessons.length,
                intermediate: intermediateLessons.length,
                advanced: advancedLessons.length
            });
        } catch (err) {
            setError('Unable to refresh lessons.');
        } finally {
            setLoading(false);
        }
    };

    const currentLevel = levelConfig[activeLevel];
    const currentLessons = lessons[activeLevel] || [];

    return (
        <div className="lessons-page">
            <div className="lessons-container">
                {/* Header */}
                <div className="lessons-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="lessons-title-section">
                        <h1>French Lessons</h1>
                        <p>Practice content uploaded by your instructors</p>
                    </div>
                    <div className="lessons-header-actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleRefresh}
                            disabled={loading}
                            aria-label="Refresh lessons"
                        >
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                            Refresh
                        </button>
                        <div className="stat-badge">
                            <Award size={18} />
                            <span>{getTotalXP()} XP earned</span>
                        </div>
                    </div>
                </div>

                {/* Level Tabs */}
                <div className="level-tabs">
                    {Object.entries(levelConfig).map(([key, level]) => (
                        <button
                            key={key}
                            className={`level-tab ${activeLevel === key ? 'active' : ''}`}
                            onClick={() => setActiveLevel(key)}
                            style={{ '--level-color': level.color }}
                            aria-selected={activeLevel === key}
                            role="tab"
                        >
                            <span className="level-icon">{level.icon}</span>
                            <div className="level-info">
                                <span className="level-name">{level.title}</span>
                                <span className="level-progress">
                                    {lessonCounts[key]} lesson{lessonCounts[key] !== 1 ? 's' : ''} available
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Level Description */}
                <div className="level-description" style={{ '--level-color': currentLevel.color }}>
                    <div className="level-header-info">
                        <div className="level-icon-large">{currentLevel.icon}</div>
                        <div>
                            <h2>{currentLevel.title}</h2>
                            <p>{currentLevel.description}</p>
                        </div>
                    </div>
                    <div className="level-progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${calculateProgress(activeLevel)}%` }}
                            role="progressbar"
                            aria-valuenow={calculateProgress(activeLevel)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="lessons-loading">
                        <Loader className="spinner" size={40} />
                        <p>Loading lessons...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="lessons-error">
                        <AlertCircle size={40} />
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={handleRefresh}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && currentLessons.length === 0 && (
                    <div className="lessons-empty">
                        <div className="empty-icon">
                            <BookOpen size={48} />
                        </div>
                        <h3>No {activeLevel} lessons available yet</h3>
                        <p>Your instructor hasn't uploaded any {activeLevel} content yet. Check back later or try another level.</p>
                        <div className="empty-actions">
                            {activeLevel !== 'beginner' && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setActiveLevel('beginner')}
                                >
                                    Try Beginner Level
                                </button>
                            )}
                            <Link to="/practice" className="btn btn-primary">
                                Go to Practice
                            </Link>
                        </div>
                    </div>
                )}

                {/* Lessons List */}
                {!loading && !error && currentLessons.length > 0 && (
                    <div className="lessons-list">
                        {currentLessons.map((lesson, index) => (
                            <div
                                key={lesson.id}
                                className={`lesson-card ${lesson.completed ? 'completed' : ''}`}
                                style={{ '--delay': `${index * 0.1}s` }}
                            >
                                <div className="lesson-number">
                                    {lesson.completed ? (
                                        <CheckCircle size={24} />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                <div className="lesson-content">
                                    <div className="lesson-header">
                                        <div className="lesson-title-row">
                                            <span className={`lesson-type-badge ${lesson.type}`}>
                                                {getLessonIcon(lesson.type)}
                                                {lesson.type}
                                            </span>
                                            <h3>{lesson.title}</h3>
                                        </div>
                                        <div className="lesson-meta">
                                            <span className="lesson-duration">
                                                <Clock size={14} />
                                                {lesson.duration || '20 min'}
                                            </span>
                                            <span className="lesson-xp">
                                                <Star size={14} />
                                                {lesson.xp || 50} XP
                                            </span>
                                        </div>
                                    </div>
                                    <p className="lesson-description">{lesson.description}</p>
                                    {lesson.topics && lesson.topics.length > 0 && (
                                        <div className="lesson-topics">
                                            {lesson.topics.map((topic, i) => (
                                                <span key={i} className="topic-tag">{topic}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="lesson-action">
                                    {lesson.completed ? (
                                        <Link
                                            to={`/practice/${lesson.type}`}
                                            className="btn btn-secondary"
                                            aria-label={`Review ${lesson.title}`}
                                        >
                                            Review
                                            <ChevronRight size={16} />
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/practice/${lesson.type}`}
                                            className="btn btn-primary"
                                            aria-label={`Start ${lesson.title}`}
                                        >
                                            Start
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Continue Learning CTA */}
                <div className="lessons-cta">
                    <div className="cta-content">
                        <BookOpen size={32} />
                        <div>
                            <h3>Ready to practice?</h3>
                            <p>Apply what you've learned with speaking and writing exercises.</p>
                        </div>
                    </div>
                    <Link to="/practice" className="btn btn-primary btn-lg">
                        Go to Practice
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Lessons;

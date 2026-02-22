import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import {
    Send, ArrowLeft, CheckCircle, BookOpen, Trash2, Loader,
    Star, ThumbsUp, AlertCircle, Lightbulb, ChevronDown, ChevronUp, XCircle,
    Eye, EyeOff, ArrowRight
} from 'lucide-react';
import API_URL from '../config/api';
import './Practice.css';

const ERROR_TYPE_CONFIG = {
    tense: { label: 'Tense', color: '#9f1239', bg: '#fff1f2' },
    grammar: { label: 'Grammar', color: '#92400e', bg: '#fffbeb' },
    agreement: { label: 'Agreement', color: '#6d28d9', bg: '#f5f3ff' },
    structure: { label: 'Structure', color: '#1e40af', bg: '#eff6ff' },
    pronoun: { label: 'Pronoun', color: '#9d174d', bg: '#fdf2f8' },
    preposition: { label: 'Preposition', color: '#155e75', bg: '#ecfeff' },
    vocabulary: { label: 'Vocabulary', color: '#5b21b6', bg: '#f5f3ff' },
    punctuation: { label: 'Punctuation', color: '#64748b', bg: '#f8fafc' },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const WritingPractice = () => {
    const { addSubmission } = useUserData();
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
    const [expandedCorrections, setExpandedCorrections] = useState({});

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/prompts/type/writing`);
                const data = await response.json();
                if (data.success) setPrompts(data.prompts || []);
            } catch (err) {
                setError('Unable to load prompts.');
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    const getWordCount = (str) => str.trim().split(/\s+/).filter(w => w.length > 0).length;

    const handleSubmit = async () => {
        if (!text.trim() || !selectedPrompt) return;
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch(`${API_URL}/api/feedback/writing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptTitle: selectedPrompt.title,
                    promptDescription: selectedPrompt.description,
                    response: text,
                    difficulty: selectedPrompt.difficulty,
                    userId: user?.id,
                    promptId: selectedPrompt.id
                })
            });

            const result = await response.json();
            if (result.success) setFeedback(result.feedback);

            addSubmission({
                type: 'writing',
                title: selectedPrompt.title,
                promptId: selectedPrompt.id,
                difficulty: selectedPrompt.difficulty,
                wordCount: getWordCount(text)
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPractice = () => {
        setSubmitted(false);
        setText('');
        setSelectedPrompt(null);
        setFeedback(null);
        setShowDetailedFeedback(false);
        setExpandedCorrections({});
    };

    const toggleCorrectionDetail = (index) => {
        setExpandedCorrections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const renderScoreStars = (score) => {
        const stars = [];
        const fullStars = Math.floor(score / 2);
        for (let i = 0; i < 5; i++) {
            stars.push(<Star key={i} size={20} fill={i < fullStars ? '#fbbf24' : 'none'} stroke={i < fullStars ? '#fbbf24' : '#d1d5db'} />);
        }
        return stars;
    };

    const getErrorTypeConfig = (type) => ERROR_TYPE_CONFIG[type] || ERROR_TYPE_CONFIG.grammar;

    const getSortedCorrections = (corrections) => {
        if (!corrections) return [];
        return [...corrections].sort((a, b) => {
            const sa = SEVERITY_ORDER[a.severity] ?? 1;
            const sb = SEVERITY_ORDER[b.severity] ?? 1;
            return sa - sb;
        });
    };

    // Feedback Screen
    if (submitted) {
        const isInvalid = feedback && !feedback.is_valid;
        const sortedCorrections = getSortedCorrections(feedback?.corrections);

        return (
            <div className="practice-page">
                <div className="feedback-page">
                    <div className="feedback-card feedback-card-wide">
                        {/* Header */}
                        <div className="feedback-card-header">
                            {isInvalid ? (
                                <XCircle size={48} className="error-icon" />
                            ) : (
                                <CheckCircle size={48} className="success-icon" />
                            )}
                            <h2>{isInvalid ? 'Please Try Again' : 'Analysis Complete'}</h2>
                            <p>{isInvalid ? feedback.message : 'Review your corrections below'}</p>
                        </div>

                        {!isInvalid && feedback && (
                            <>
                                {/* Score */}
                                <div className="feedback-score-box">
                                    <div className="score-big">{feedback.overall_score}<span>/10</span></div>
                                    <div className="score-stars">{renderScoreStars(feedback.overall_score)}</div>
                                </div>

                                {/* Summary */}
                                <div className="feedback-summary-box">
                                    <p>{feedback.summary}</p>
                                </div>

                                {/* ===== SPLIT VIEW: Original vs Corrected ===== */}
                                {feedback.corrected_text && (
                                    <div className="text-comparison">
                                        <h4 className="comparison-title">
                                            <Eye size={18} /> Text Comparison
                                        </h4>
                                        <div className="comparison-grid">
                                            <div className="comparison-panel original">
                                                <div className="panel-label">
                                                    <span className="label-dot original-dot"></span>
                                                    Your Text
                                                </div>
                                                <div className="panel-text">{feedback.original_text || text}</div>
                                            </div>
                                            <div className="comparison-divider">
                                                <ArrowRight size={20} />
                                            </div>
                                            <div className="comparison-panel corrected">
                                                <div className="panel-label">
                                                    <span className="label-dot corrected-dot"></span>
                                                    Corrected Text
                                                </div>
                                                <div className="panel-text">{feedback.corrected_text}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ===== CORRECTIONS WITH ERROR TYPES ===== */}
                                {sortedCorrections.length > 0 && (
                                    <div className="corrections-section">
                                        <h4 className="section-title">
                                            <AlertCircle size={18} /> Corrections
                                            <span className="correction-count">{sortedCorrections.length} {sortedCorrections.length === 1 ? 'issue' : 'issues'}</span>
                                        </h4>
                                        <div className="corrections-list">
                                            {sortedCorrections.map((c, i) => {
                                                const typeConfig = getErrorTypeConfig(c.type);
                                                const briefText = c.brief || c.explanation || '';
                                                const ruleText = c.rule || '';
                                                return (
                                                    <div key={i} className={`correction-card severity-${c.severity || 'medium'}`}>
                                                        <div className="correction-card-header">
                                                            <span
                                                                className="error-type-badge"
                                                                style={{ color: typeConfig.color, background: typeConfig.bg }}
                                                            >
                                                                {typeConfig.label}
                                                            </span>
                                                            {c.severity && (
                                                                <span className={`severity-indicator severity-${c.severity}`}>
                                                                    {c.severity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="correction-row">
                                                            <span className="wrong">{c.original}</span>
                                                            <span className="arrow">→</span>
                                                            <span className="correct">{c.corrected}</span>
                                                        </div>
                                                        {briefText && (
                                                            <p className="correction-brief">{briefText}</p>
                                                        )}
                                                        {ruleText && (
                                                            <>
                                                                <button
                                                                    className="detail-toggle"
                                                                    onClick={() => toggleCorrectionDetail(i)}
                                                                >
                                                                    {expandedCorrections[i] ? (
                                                                        <>Hide grammar rule <ChevronUp size={14} /></>
                                                                    ) : (
                                                                        <>Show grammar rule <ChevronDown size={14} /></>
                                                                    )}
                                                                </button>
                                                                {expandedCorrections[i] && (
                                                                    <p className="correction-explanation-detail">{ruleText}</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Strengths — brief */}
                                {feedback.strengths?.length > 0 && (
                                    <div className="feedback-box strengths">
                                        <h4><ThumbsUp size={18} /> Strengths</h4>
                                        <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}

                                {/* Areas to Improve — brief */}
                                {feedback.areas_for_improvement?.length > 0 && (
                                    <div className="feedback-box improvements">
                                        <h4><AlertCircle size={18} /> Areas to Improve</h4>
                                        <ul>{feedback.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}

                                {/* Expandable Details */}
                                {(feedback.vocabulary_suggestions?.length > 0 || feedback.tips?.length > 0) && (
                                    <>
                                        <button className="expand-btn" onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}>
                                            {showDetailedFeedback ? <>Hide Details <ChevronUp size={18} /></> : <>Vocabulary & Tips <ChevronDown size={18} /></>}
                                        </button>

                                        {showDetailedFeedback && (
                                            <div className="detailed-section">
                                                {/* Vocabulary */}
                                                {feedback.vocabulary_suggestions?.length > 0 && (
                                                    <div className="feedback-box vocabulary">
                                                        <h4>📚 Vocabulary Suggestions</h4>
                                                        {feedback.vocabulary_suggestions.map((v, i) => (
                                                            <div key={i} className="vocab-item">
                                                                <span className="old-word">{v.used}</span>
                                                                <span className="arrow">→</span>
                                                                <span className="new-word">{v.alternative}</span>
                                                                <p className="explanation">{v.explanation}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Tips */}
                                                {feedback.tips?.length > 0 && (
                                                    <div className="feedback-box tips">
                                                        <h4><Lightbulb size={18} /> Tips</h4>
                                                        <ul>{feedback.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* Actions */}
                        <div className="feedback-buttons">
                            <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                            <button onClick={resetPractice} className="btn btn-secondary">Practice Again</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Practice Screen
    return (
        <div className="practice-page">
            <div className="practice-container">
                <div className="practice-header">
                    <Link to="/practice" className="back-link">
                        <ArrowLeft size={20} /> Back to Practice
                    </Link>
                    <h1>Writing Practice</h1>
                    <p>Write in French and receive AI-powered feedback</p>
                </div>

                <div className="practice-content">
                    {/* Prompts */}
                    <div className="prompts-section">
                        <h3>Choose a Prompt</h3>
                        <div className="prompts-list">
                            {loading ? (
                                <div className="loading-state"><Loader className="spinner" size={32} /><p>Loading...</p></div>
                            ) : prompts.length === 0 ? (
                                <div className="empty-state"><p>No prompts available.</p></div>
                            ) : (
                                prompts.map((prompt) => (
                                    <div
                                        key={prompt.id}
                                        className={`prompt-card ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedPrompt(prompt)}
                                    >
                                        <div className="prompt-header">
                                            <h4>{prompt.title}</h4>
                                            <span className={`difficulty-badge ${prompt.difficulty}`}>{prompt.difficulty}</span>
                                        </div>
                                        <p>{prompt.description}</p>
                                        <div className="prompt-meta">
                                            <BookOpen size={14} /> <span>Goal: {prompt.wordGoal || 150} words</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Writing */}
                    <div className="writing-section">
                        <h3>Your Response</h3>

                        {selectedPrompt ? (
                            <div className="selected-prompt-display">
                                <h4>{selectedPrompt.title}</h4>
                                <p>{selectedPrompt.description}</p>
                            </div>
                        ) : (
                            <div className="no-prompt-message"><p>Please select a prompt</p></div>
                        )}

                        <div className="writing-container">
                            <textarea
                                className="writing-textarea"
                                placeholder="Écrivez votre réponse en français ici... (Write your response in French here...)"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={!selectedPrompt}
                            />
                            <div className="writing-footer">
                                <span className="word-count">
                                    Words: {getWordCount(text)} {selectedPrompt && `/ ${selectedPrompt.wordGoal || 150}`}
                                </span>
                            </div>
                        </div>

                        <div className="action-buttons">
                            {text.length > 0 && (
                                <button className="btn btn-secondary" onClick={() => setText('')}>
                                    <Trash2 size={18} /> Clear
                                </button>
                            )}
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !text.trim() || !selectedPrompt}
                            >
                                {isSubmitting ? <><Loader className="spinner-small" size={18} /> Analyzing...</> : <>Submit <Send size={20} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WritingPractice;

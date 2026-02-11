import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import {
    Send, ArrowLeft, CheckCircle, BookOpen, Trash2, Loader,
    Star, ThumbsUp, AlertCircle, Lightbulb, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import './Practice.css';

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

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/prompts/type/writing');
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
            const response = await fetch('http://localhost:5000/api/feedback/writing', {
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
    };

    const renderScoreStars = (score) => {
        const stars = [];
        const fullStars = Math.floor(score / 2);
        for (let i = 0; i < 5; i++) {
            stars.push(<Star key={i} size={20} fill={i < fullStars ? '#fbbf24' : 'none'} stroke={i < fullStars ? '#fbbf24' : '#d1d5db'} />);
        }
        return stars;
    };

    // Feedback Screen
    if (submitted) {
        const isInvalid = feedback && !feedback.is_valid;

        return (
            <div className="practice-page">
                <div className="feedback-page">
                    <div className="feedback-card">
                        {/* Header */}
                        <div className="feedback-card-header">
                            {isInvalid ? (
                                <XCircle size={48} className="error-icon" />
                            ) : (
                                <CheckCircle size={48} className="success-icon" />
                            )}
                            <h2>{isInvalid ? 'Please Try Again' : 'Practice Complete!'}</h2>
                            <p>{isInvalid ? feedback.message : 'Here\'s your AI-powered feedback'}</p>
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

                                {/* Strengths */}
                                {feedback.strengths?.length > 0 && (
                                    <div className="feedback-box strengths">
                                        <h4><ThumbsUp size={18} /> Strengths</h4>
                                        <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}

                                {/* Areas to Improve */}
                                {feedback.areas_for_improvement?.length > 0 && (
                                    <div className="feedback-box improvements">
                                        <h4><AlertCircle size={18} /> Areas to Improve</h4>
                                        <ul>{feedback.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}

                                {/* Expandable Details */}
                                <button className="expand-btn" onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}>
                                    {showDetailedFeedback ? <>Hide Details <ChevronUp size={18} /></> : <>Show Details <ChevronDown size={18} /></>}
                                </button>

                                {showDetailedFeedback && (
                                    <div className="detailed-section">
                                        {/* Grammar Corrections */}
                                        {feedback.grammar_corrections?.length > 0 && (
                                            <div className="feedback-box grammar">
                                                <h4>📝 Grammar Corrections</h4>
                                                {feedback.grammar_corrections.map((c, i) => (
                                                    <div key={i} className="correction-item">
                                                        <div className="correction-row">
                                                            <span className="wrong">{c.original}</span>
                                                            <span className="arrow">→</span>
                                                            <span className="correct">{c.corrected}</span>
                                                        </div>
                                                        <p className="explanation">{c.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

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

                                {/* Encouragement */}
                                {feedback.encouragement && (
                                    <div className="encouragement-box">
                                        <p>💪 {feedback.encouragement}</p>
                                    </div>
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

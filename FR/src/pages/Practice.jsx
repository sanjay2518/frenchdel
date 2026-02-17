import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, PenTool, ArrowLeft, Loader, AlertCircle, Volume2, MessageCircle } from 'lucide-react';
import API_URL from '../config/api';
import './Practice.css';

const Practice = () => {
    const [speakingPrompts, setSpeakingPrompts] = useState([]);
    const [writingPrompts, setWritingPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch both speaking and writing prompts
                const [speakingRes, writingRes] = await Promise.all([
                    fetch(`${API_URL}/api/prompts/type/speaking`),
                    fetch(`${API_URL}/api/prompts/type/writing`)
                ]);

                const speakingData = await speakingRes.json();
                const writingData = await writingRes.json();

                if (speakingData.success) {
                    setSpeakingPrompts(speakingData.prompts || []);
                }
                if (writingData.success) {
                    setWritingPrompts(writingData.prompts || []);
                }
            } catch (err) {
                console.error('Error fetching prompts:', err);
                setError('Unable to load practice content. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    const hasSpeaking = speakingPrompts.length > 0;
    const hasWriting = writingPrompts.length > 0;

    return (
        <div className="practice-page">
            <div className="practice-container">
                <div className="practice-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <h1>Practice Center</h1>
                    <p>Choose your preferred mode of practice to improve your French skills.</p>
                </div>

                {loading ? (
                    <div className="practice-loading">
                        <Loader className="spinner" size={40} />
                        <p>Loading available practice content...</p>
                    </div>
                ) : error ? (
                    <div className="practice-error">
                        <AlertCircle size={40} />
                        <p>{error}</p>
                        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="practice-selection-grid">
                        {/* NEW: Free Speaking Practice - Always visible */}
                        <Link to="/practice/speaking" className="selection-card">
                            <div className="selection-icon free-speaking">
                                <MessageCircle size={40} />
                            </div>
                            <h2>Speaking Practice</h2>
                            <p>
                                Speak freely in French about anything you want.
                                Get instant AI-powered feedback on your grammar, fluency,
                                vocabulary, and pronunciation. No prompts needed!
                            </p>
                            <span className="prompt-count free-badge">🇫🇷 French Only • Free Speech</span>
                            <span className="btn btn-primary">Start Speaking</span>
                        </Link>

                        {/* Pronunciation Practice (renamed from Speaking Practice) */}
                        {hasSpeaking && (
                            <Link to="/practice/pronunciation" className="selection-card">
                                <div className="selection-icon speaking">
                                    <Volume2 size={40} />
                                </div>
                                <h2>Pronunciation Practice</h2>
                                <p>
                                    Record your voice responding to various prompts.
                                    Improve your pronunciation, fluency, and oral expression
                                    with expert feedback on your recordings.
                                </p>
                                <span className="prompt-count">{speakingPrompts.length} prompt{speakingPrompts.length !== 1 ? 's' : ''} available</span>
                                <span className="btn btn-primary">Start Practice</span>
                            </Link>
                        )}

                        {hasWriting && (
                            <Link to="/practice/writing" className="selection-card">
                                <div className="selection-icon writing">
                                    <PenTool size={40} />
                                </div>
                                <h2>Writing Practice</h2>
                                <p>
                                    Write responses to creative and practical writing prompts.
                                    Enhance your grammar, vocabulary, and written structure
                                    with detailed corrections and suggestions.
                                </p>
                                <span className="prompt-count">{writingPrompts.length} prompt{writingPrompts.length !== 1 ? 's' : ''} available</span>
                                <span className="btn btn-primary">Start Writing</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Practice;

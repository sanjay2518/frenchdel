import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, PenTool, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
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
                    fetch('http://localhost:5000/api/prompts/type/speaking'),
                    fetch('http://localhost:5000/api/prompts/type/writing')
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
    const hasAnyContent = hasSpeaking || hasWriting;

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
                ) : !hasAnyContent ? (
                    <div className="practice-no-content">
                        <AlertCircle size={48} />
                        <h2>No Practice Content Available</h2>
                        <p>The admin has not uploaded any practice prompts yet.</p>
                        <p className="hint">Please check back later when new content is available.</p>
                        <Link to="/dashboard" className="btn btn-primary">
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="practice-selection-grid">
                        {hasSpeaking && (
                            <Link to="/practice/speaking" className="selection-card">
                                <div className="selection-icon speaking">
                                    <Mic size={40} />
                                </div>
                                <h2>Speaking Practice</h2>
                                <p>
                                    Record your voice responding to various prompts.
                                    Improve your pronunciation, fluency, and oral expression
                                    with expert feedback on your recordings.
                                </p>
                                <span className="prompt-count">{speakingPrompts.length} prompt{speakingPrompts.length !== 1 ? 's' : ''} available</span>
                                <span className="btn btn-primary">Start Speaking</span>
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

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import {
    Mic, MicOff, Play, Pause,
    Send, ArrowLeft, Clock, CheckCircle,
    Trash2, Loader, Star, ThumbsUp,
    AlertCircle, Lightbulb, ChevronDown, ChevronUp, XCircle,
    Eye, ArrowRight
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

const SpeakingPractice = () => {
    const { addSubmission } = useUserData();
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
    const [expandedCorrections, setExpandedCorrections] = useState({});

    // Real-time speech transcription
    const [transcription, setTranscription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                }
                if (finalTranscript) {
                    setTranscription(prev => prev + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access for speech recognition.');
                }
                if (event.error === 'aborted' || event.error === 'network') {
                    // Chrome mobile: recognition stops when app goes to background
                    if (isRecording && recognitionRef.current) {
                        setTimeout(() => {
                            try { recognitionRef.current.start(); } catch (e) { /* already running */ }
                        }, 500);
                    }
                }
                if (event.error === 'no-speech' && isRecording && recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch (e) { /* already running */ }
                }
            };

            recognitionRef.current.onend = () => {
                if (isRecording && recognitionRef.current) {
                    setTimeout(() => {
                        try { recognitionRef.current.start(); } catch (e) { /* already running */ }
                    }, 300);
                }
            };
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [isRecording]);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/prompts/type/speaking`);
                const data = await response.json();
                if (data.success) setPrompts(data.prompts || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            setTranscription('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

            if (recognitionRef.current && speechSupported) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.log('Recognition start error:', e);
                }
            }
        } catch (err) {
            alert('Unable to access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsListening(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    };

    const playRecording = () => {
        if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const deleteRecording = () => {
        setRecordedBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setTranscription('');
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const handleSubmit = async () => {
        if (!recordedBlob || !selectedPrompt) return;
        if (!transcription.trim()) {
            alert('No speech was detected. Please speak in French while recording.');
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch(`${API_URL}/api/feedback/speaking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptTitle: selectedPrompt.title,
                    promptDescription: selectedPrompt.description,
                    duration: recordingTime,
                    difficulty: selectedPrompt.difficulty,
                    userId: user?.id,
                    promptId: selectedPrompt.id,
                    transcription: transcription
                })
            });

            const result = await response.json();
            if (result.success) setFeedback(result.feedback);

            addSubmission({
                type: 'speaking',
                title: selectedPrompt.title,
                promptId: selectedPrompt.id,
                difficulty: selectedPrompt.difficulty,
                duration: recordingTime,
                transcription: transcription
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
        setRecordedBlob(null);
        setAudioUrl(null);
        setSelectedPrompt(null);
        setFeedback(null);
        setShowDetailedFeedback(false);
        setRecordingTime(0);
        setTranscription('');
        setExpandedCorrections({});
    };

    const toggleCorrectionDetail = (index) => {
        setExpandedCorrections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const renderScoreStars = (score) => {
        if (!score) return null;
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
        const hasScore = feedback && feedback.overall_score;
        const sortedCorrections = getSortedCorrections(feedback?.corrections);

        return (
            <div className="practice-page">
                <div className="feedback-page">
                    <div className="feedback-card feedback-card-wide">
                        <div className="feedback-card-header">
                            {isInvalid ? <XCircle size={48} className="error-icon" /> : <CheckCircle size={48} className="success-icon" />}
                            <h2>{isInvalid ? 'Please Try Again' : 'Analysis Complete'}</h2>
                            <p>{isInvalid ? feedback.message : 'Review your corrections below'}</p>
                        </div>

                        {!isInvalid && feedback && (
                            <>
                                {hasScore && (
                                    <div className="feedback-score-box">
                                        <div className="score-big">{feedback.overall_score}<span>/10</span></div>
                                        <div className="score-stars">{renderScoreStars(feedback.overall_score)}</div>
                                    </div>
                                )}

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
                                                    What You Said
                                                </div>
                                                <div className="panel-text">{feedback.original_text || transcription}</div>
                                            </div>
                                            <div className="comparison-divider">
                                                <ArrowRight size={20} />
                                            </div>
                                            <div className="comparison-panel corrected">
                                                <div className="panel-label">
                                                    <span className="label-dot corrected-dot"></span>
                                                    Corrected Version
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

                                {/* Fluency */}
                                {feedback.fluency_assessment && (
                                    <div className="feedback-box fluency">
                                        <h4>🎯 Fluency</h4>
                                        <p>{feedback.fluency_assessment}</p>
                                    </div>
                                )}

                                {/* Expandable Details */}
                                {(feedback.pronunciation_notes?.length > 0 || feedback.tips?.length > 0) && (
                                    <>
                                        <button className="expand-btn" onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}>
                                            {showDetailedFeedback ? <>Hide Details <ChevronUp size={18} /></> : <>Pronunciation & Tips <ChevronDown size={18} /></>}
                                        </button>

                                        {showDetailedFeedback && (
                                            <div className="detailed-section">
                                                {feedback.pronunciation_notes?.length > 0 && (
                                                    <div className="feedback-box pronunciation">
                                                        <h4>🗣️ Pronunciation</h4>
                                                        {feedback.pronunciation_notes.map((p, i) => (
                                                            <div key={i} className="tip-item"><strong>{p.word}</strong>: {p.suggestion}</div>
                                                        ))}
                                                    </div>
                                                )}
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
                    <h1>Speaking Practice</h1>
                    <p>Speak in French and receive instant AI feedback</p>
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
                                        <div className="prompt-meta"><Clock size={14} /> <span>{formatTime(prompt.timeLimit || 180)}</span></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recording */}
                    <div className="recording-section">
                        <h3>Record Your Response</h3>

                        {!speechSupported && (
                            <div className="browser-warning">
                                ⚠️ Speech recognition not supported in this browser. Please use Chrome or Edge.
                            </div>
                        )}

                        {selectedPrompt ? (
                            <div className="selected-prompt-display">
                                <h4>{selectedPrompt.title}</h4>
                                <p>{selectedPrompt.description}</p>
                            </div>
                        ) : (
                            <div className="no-prompt-message"><p>Please select a prompt</p></div>
                        )}

                        <div className="recorder-container">
                            <div className={`waveform-display ${isRecording ? 'active' : ''}`}>
                                {[...Array(30)].map((_, i) => (
                                    <div key={i} className="wave-bar" style={{ height: isRecording ? `${Math.random() * 80 + 20}%` : '20%' }} />
                                ))}
                            </div>

                            <div className="recording-timer">
                                <span className={isRecording ? 'recording' : ''}>{formatTime(recordingTime)}</span>
                            </div>

                            <div className="recorder-controls">
                                {!recordedBlob ? (
                                    <button
                                        className={`record-btn ${isRecording ? 'recording' : ''}`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={!selectedPrompt || !speechSupported}
                                    >
                                        {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                                    </button>
                                ) : (
                                    <div className="playback-controls">
                                        <button className="control-btn" onClick={playRecording}>
                                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                        </button>
                                        <button className="control-btn delete" onClick={deleteRecording}>
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}

                            <p className="recording-instructions">
                                {isRecording ? '🔴 Recording & transcribing... Speak in French!' : recordedBlob ? '✅ Recording complete!' : '🎤 Click to start - speak in French'}
                            </p>
                        </div>

                        {/* Live Transcription Display */}
                        {(isRecording || transcription) && (
                            <div className="live-transcription">
                                <div className="transcription-label">
                                    {isRecording && <span className="live-indicator">● LIVE</span>}
                                    <span>Real-time transcription (French):</span>
                                </div>
                                <div className="transcription-text">
                                    {transcription || <span className="placeholder">Listening... Start speaking in French</span>}
                                </div>
                            </div>
                        )}

                        {recordedBlob && (
                            <button
                                className="btn btn-primary btn-lg submit-btn"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !transcription.trim()}
                            >
                                {isSubmitting ? <><Loader className="spinner-small" size={18} /> Analyzing...</> : <>Get AI Feedback <Send size={20} /></>}
                            </button>
                        )}

                        {recordedBlob && !transcription.trim() && (
                            <p className="transcription-required">⚠️ No French speech detected. Please record again and speak in French.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeakingPractice;

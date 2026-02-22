import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import {
    Mic, MicOff, Play, Pause,
    ArrowLeft, Clock, CheckCircle,
    Trash2, Loader, Star, ThumbsUp,
    AlertCircle, Lightbulb, ChevronDown, ChevronUp, XCircle,
    Send, BookOpen, Volume2, MessageCircle, Eye, ArrowRight
} from 'lucide-react';
import API_URL from '../config/api';
import './FreeSpeakingPractice.css';

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

const FreeSpeakingPractice = () => {
    const { addSubmission } = useUserData();
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [expandedCorrections, setExpandedCorrections] = useState({});

    // Real-time speech transcription
    const [transcription, setTranscription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const recognitionRef = useRef(null);
    const waveIntervalRef = useRef(null);
    const isRecordingRef = useRef(false);
    const feedbackRef = useRef(null);
    const [waveBars, setWaveBars] = useState(Array(40).fill(20));

    // Keep ref in sync with state
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    // Initialize Speech Recognition ONCE on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-FR';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
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

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access.');
                }
                if (event.error === 'no-speech' && isRecordingRef.current) {
                    try { recognition.start(); } catch (e) { /* already running */ }
                }
            };

            recognition.onend = () => {
                if (isRecordingRef.current) {
                    try { recognition.start(); } catch (e) { /* skip */ }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    // Auto-scroll to feedback when it appears
    useEffect(() => {
        if (feedback && feedbackRef.current) {
            setTimeout(() => {
                feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    }, [feedback]);

    const startRecording = async () => {
        try {
            setTranscription('');
            setFeedback(null);
            setExpandedCorrections({});
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

            waveIntervalRef.current = setInterval(() => {
                setWaveBars(prev => prev.map(() => Math.random() * 80 + 20));
            }, 150);

            if (recognitionRef.current && speechSupported) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.log('Recognition start error:', e);
                }
            }
        } catch (err) {
            alert('Unable to access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsListening(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
            setWaveBars(Array(40).fill(20));

            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
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
        setFeedback(null);
        setExpandedCorrections({});
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const handleSubmit = async () => {
        if (!recordedBlob) return;

        if (!transcription.trim()) {
            alert('No speech was detected. Please speak in French while recording.');
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch(`${API_URL}/api/feedback/free-speaking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration: recordingTime,
                    userId: user?.id,
                    transcription: transcription
                })
            });

            const result = await response.json();
            if (result.success && result.feedback) {
                setFeedback(result.feedback);
            } else if (result.error) {
                setFeedback({
                    type: 'free-speaking', ai_generated: false, is_valid: true, overall_score: null,
                    summary: `Server error: ${result.error}. Please try again later.`,
                    strengths: ['Exercise completed.'],
                    areas_for_improvement: ['Try again when the AI service is available.'],
                    corrections: [],
                    tips: ['Keep practicing regularly.'],
                });
            } else {
                setFeedback({
                    type: 'free-speaking', ai_generated: false, is_valid: true, overall_score: null,
                    summary: 'AI feedback could not be generated at this time. Please try again.',
                    strengths: ['Exercise completed.'],
                    corrections: [],
                    tips: ['Keep practicing.'],
                });
            }

            addSubmission({
                type: 'speaking',
                title: 'Free Speaking Practice',
                difficulty: 'free',
                duration: recordingTime,
                transcription: transcription
            });
        } catch (err) {
            console.error('Free speaking feedback error:', err);
            setFeedback({
                type: 'free-speaking', ai_generated: false, is_valid: true, overall_score: null,
                summary: 'Could not connect to the AI feedback server. Your speech was recorded successfully.',
                strengths: ['Exercise completed.'],
                areas_for_improvement: ['Try submitting again when the server is available.'],
                fluency_assessment: 'Fluency analysis will be available once the server connection is restored.',
                corrections: [],
                tips: ['Keep practicing regularly.', 'Try speaking for longer durations.'],
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPractice = () => {
        setRecordedBlob(null);
        setAudioUrl(null);
        setFeedback(null);
        setRecordingTime(0);
        setTranscription('');
        setExpandedCorrections({});
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

    const toggleCorrectionDetail = (index) => {
        setExpandedCorrections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const isInvalid = feedback && !feedback.is_valid;
    const hasScore = feedback && feedback.overall_score;
    const sortedCorrections = getSortedCorrections(feedback?.corrections);

    // =================== SINGLE PAGE — RECORDING + INLINE FEEDBACK ===================
    return (
        <div className="free-speaking-page">
            <div className="fs-container">
                <div className="fs-header">
                    <Link to="/practice" className="back-link">
                        <ArrowLeft size={20} /> Back to Practice
                    </Link>
                    <h1>Speaking Practice</h1>
                    <p>Speak freely in French about anything — get instant AI analysis on grammar, fluency, vocabulary and more</p>
                </div>

                <div className="fs-main-content">
                    {/* Instructions Card */}
                    <div className="fs-instructions-card">
                        <div className="fs-instruction-icon">
                            <Mic size={32} />
                        </div>
                        <h3>How It Works</h3>
                        <div className="fs-steps">
                            <div className="fs-step">
                                <span className="step-num">1</span>
                                <span>Click <strong>"Start Speaking"</strong> below</span>
                            </div>
                            <div className="fs-step">
                                <span className="step-num">2</span>
                                <span>Speak freely in <strong>French</strong> about any topic</span>
                            </div>
                            <div className="fs-step">
                                <span className="step-num">3</span>
                                <span>Click <strong>"Stop Recording"</strong> when finished</span>
                            </div>
                            <div className="fs-step">
                                <span className="step-num">4</span>
                                <span>Get <strong>instant AI feedback</strong> on your speech</span>
                            </div>
                        </div>
                        <div className="fs-language-badge">
                            <span>🇫🇷 French Only</span>
                        </div>
                    </div>

                    {/* Right Column: Recording + Feedback */}
                    <div className="fs-right-column">
                        {/* Recording Card */}
                        <div className="fs-recording-card">
                            {!speechSupported && (
                                <div className="fs-browser-warning">
                                    <AlertCircle size={20} />
                                    <span>Speech recognition not supported in this browser. Please use <strong>Chrome</strong> or <strong>Edge</strong>.</span>
                                </div>
                            )}

                            <div className="fs-recorder">
                                <div className={`fs-waveform ${isRecording ? 'active' : ''}`}>
                                    {waveBars.map((height, i) => (
                                        <div
                                            key={i}
                                            className="fs-wave-bar"
                                            style={{
                                                height: `${isRecording ? height : 20}%`,
                                                animationDelay: `${i * 0.03}s`
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="fs-timer">
                                    <Clock size={20} />
                                    <span className={isRecording ? 'active' : ''}>{formatTime(recordingTime)}</span>
                                </div>

                                <div className="fs-controls">
                                    {!recordedBlob ? (
                                        <button
                                            className={`fs-record-btn ${isRecording ? 'recording' : ''}`}
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={!speechSupported}
                                            id="start-speaking-btn"
                                        >
                                            <div className="fs-btn-inner">
                                                {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
                                            </div>
                                            <span className="fs-btn-label">
                                                {isRecording ? 'Stop Recording' : 'Start Speaking'}
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="fs-playback">
                                            <button className="fs-control-btn play" onClick={playRecording}>
                                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                            </button>
                                            <button className="fs-control-btn delete" onClick={deleteRecording}>
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}

                                <p className="fs-status-text">
                                    {isSubmitting
                                        ? '🤖 Analyzing your speech with AI...'
                                        : isRecording
                                            ? '🔴 Recording & transcribing... Speak in French!'
                                            : recordedBlob
                                                ? feedback
                                                    ? '✅ Analysis complete! See your feedback below.'
                                                    : '✅ Recording complete! Click "Get AI Feedback" below.'
                                                : '🎤 Click the button above to start speaking in French'}
                                </p>
                            </div>

                            {/* Live Transcription */}
                            {(isRecording || transcription) && (
                                <div className="fs-live-transcription">
                                    <div className="fs-transcription-header">
                                        {isRecording && <span className="fs-live-badge">● LIVE</span>}
                                        <span>Real-time French transcription:</span>
                                    </div>
                                    <div className="fs-transcription-content">
                                        {transcription || <span className="fs-placeholder">Listening... Start speaking in French</span>}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            {recordedBlob && !feedback && (
                                <button
                                    className="fs-submit-btn"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !transcription.trim()}
                                    id="get-feedback-btn"
                                >
                                    {isSubmitting
                                        ? <><Loader className="spinner-small" size={20} /> Analyzing your speech...</>
                                        : <><Send size={20} /> Get AI Feedback</>
                                    }
                                </button>
                            )}

                            {recordedBlob && !transcription.trim() && !feedback && (
                                <div className="fs-no-speech-warning">
                                    <AlertCircle size={18} />
                                    <span>No French speech detected. Please record again and speak in French.</span>
                                </div>
                            )}
                        </div>

                        {/* =================== INLINE AI FEEDBACK =================== */}
                        {feedback && (
                            <div className="fs-inline-feedback" ref={feedbackRef}>
                                {/* Header */}
                                <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0s' }}>
                                    <div className="fs-feedback-header">
                                        {isInvalid
                                            ? <XCircle size={48} className="error-icon" />
                                            : <CheckCircle size={48} className="success-icon" />
                                        }
                                        <h2>{isInvalid ? 'Please Try Again' : 'Analysis Complete'}</h2>
                                        <p>{isInvalid ? feedback.message : 'Review your corrections below'}</p>
                                    </div>
                                </div>

                                {!isInvalid && (
                                    <>
                                        {/* Score Ring */}
                                        {hasScore && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.15s' }}>
                                                <div className="fs-score-box">
                                                    <div className="fs-score-ring">
                                                        <svg viewBox="0 0 120 120">
                                                            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                                            <circle
                                                                cx="60" cy="60" r="52"
                                                                fill="none"
                                                                stroke="url(#scoreGrad)"
                                                                strokeWidth="8"
                                                                strokeLinecap="round"
                                                                strokeDasharray={`${(feedback.overall_score / 10) * 326.7} 326.7`}
                                                                transform="rotate(-90 60 60)"
                                                            />
                                                            <defs>
                                                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                    <stop offset="0%" stopColor="#10b981" />
                                                                    <stop offset="100%" stopColor="#34d399" />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>
                                                        <div className="fs-score-value">{feedback.overall_score}<span>/10</span></div>
                                                    </div>
                                                    <div className="fs-score-stars">{renderScoreStars(feedback.overall_score)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {feedback.summary && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.25s' }}>
                                                <div className="fs-summary-box">
                                                    <p>{feedback.summary}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* ===== SPLIT VIEW: Original vs Corrected ===== */}
                                        {feedback.corrected_text && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.3s' }}>
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
                                            </div>
                                        )}

                                        {/* ===== CORRECTIONS WITH ERROR TYPES ===== */}
                                        {sortedCorrections.length > 0 && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.4s' }}>
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
                                            </div>
                                        )}

                                        {/* Strengths */}
                                        {feedback.strengths?.length > 0 && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.5s' }}>
                                                <div className="fs-feedback-section positive">
                                                    <h4><ThumbsUp size={18} /> Strengths</h4>
                                                    <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                                </div>
                                            </div>
                                        )}

                                        {/* Areas of improvement */}
                                        {feedback.areas_for_improvement?.length > 0 && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.6s' }}>
                                                <div className="fs-feedback-section improvement">
                                                    <h4><AlertCircle size={18} /> Areas to Improve</h4>
                                                    <ul>{feedback.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vocabulary */}
                                        {feedback.vocabulary_suggestions?.length > 0 && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.7s' }}>
                                                <div className="fs-feedback-section vocabulary">
                                                    <h4><BookOpen size={18} /> Vocabulary</h4>
                                                    <div className="fs-vocab-list">
                                                        {feedback.vocabulary_suggestions.map((v, i) => (
                                                            <div key={i} className="fs-vocab-item">
                                                                <span className="used-word">{v.used}</span>
                                                                <span className="arrow">→</span>
                                                                <span className="better-word">{v.alternative}</span>
                                                                <span className="explanation">{v.explanation}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fluency */}
                                        {feedback.fluency_assessment && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.8s' }}>
                                                <div className="fs-feedback-section fluency">
                                                    <h4><Volume2 size={18} /> Fluency Assessment</h4>
                                                    <p>{feedback.fluency_assessment}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pronunciation + Tips */}
                                        {(feedback.pronunciation_notes?.length > 0 || feedback.tips?.length > 0) && (
                                            <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '0.9s' }}>
                                                {feedback.pronunciation_notes?.length > 0 && (
                                                    <div className="fs-feedback-section pronunciation">
                                                        <h4>🗣️ Pronunciation Notes</h4>
                                                        {feedback.pronunciation_notes.map((p, i) => (
                                                            <div key={i} className="fs-tip-item"><strong>{p.word}</strong>: {p.suggestion}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                {feedback.tips?.length > 0 && (
                                                    <div className="fs-feedback-section tips" style={{ marginTop: feedback.pronunciation_notes?.length > 0 ? '1rem' : 0 }}>
                                                        <h4><Lightbulb size={18} /> Tips</h4>
                                                        <ul>{feedback.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="fs-feedback-card fs-animate-in" style={{ animationDelay: '1s' }}>
                                    <div className="fs-feedback-actions">
                                        <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                                        <button onClick={resetPractice} className="btn btn-secondary">Practice Again</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreeSpeakingPractice;

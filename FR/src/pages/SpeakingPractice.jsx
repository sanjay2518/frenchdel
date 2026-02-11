import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import {
    Mic, MicOff, Play, Pause, Upload,
    Send, ArrowLeft, Clock, CheckCircle,
    Trash2, Loader, Star, ThumbsUp,
    AlertCircle, Lightbulb, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import API_URL from '../config/api';
import './Practice.css';

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
            recognitionRef.current.lang = 'fr-FR'; // French language

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
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
            };

            recognitionRef.current.onend = () => {
                // Restart if still recording
                if (isRecording && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log('Recognition already started');
                    }
                }
            };
        } else {
            console.log('Speech recognition not supported');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
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
            // Clear previous transcription
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

            // Start speech recognition
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

            // Stop speech recognition
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
                    transcription: transcription // Automatic transcription
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

    // Feedback Screen
    if (submitted) {
        const isInvalid = feedback && !feedback.is_valid;
        const hasScore = feedback && feedback.overall_score;

        return (
            <div className="practice-page">
                <div className="feedback-page">
                    <div className="feedback-card">
                        <div className="feedback-card-header">
                            {isInvalid ? <XCircle size={48} className="error-icon" /> : <CheckCircle size={48} className="success-icon" />}
                            <h2>{isInvalid ? 'Please Try Again' : 'Practice Complete!'}</h2>
                            <p>{isInvalid ? feedback.message : 'Here\'s your AI-powered feedback'}</p>
                        </div>

                        {!isInvalid && feedback && (
                            <>
                                {hasScore && (
                                    <div className="feedback-score-box">
                                        <div className="score-big">{feedback.overall_score}<span>/10</span></div>
                                        <div className="score-stars">{renderScoreStars(feedback.overall_score)}</div>
                                    </div>
                                )}

                                {/* Show what was transcribed */}
                                <div className="transcription-result">
                                    <h4>🎤 What you said:</h4>
                                    <p className="transcribed-text">"{transcription}"</p>
                                </div>

                                <div className="feedback-summary-box">
                                    <p>{feedback.summary}</p>
                                </div>

                                {feedback.strengths?.length > 0 && (
                                    <div className="feedback-box strengths">
                                        <h4><ThumbsUp size={18} /> Strengths</h4>
                                        <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}

                                {feedback.areas_for_improvement?.length > 0 && (
                                    <div className="feedback-box improvements">
                                        <h4><AlertCircle size={18} /> Areas to Improve</h4>
                                        <ul>{feedback.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}

                                {feedback.fluency_assessment && (
                                    <div className="feedback-box fluency">
                                        <h4>🎯 Fluency</h4>
                                        <p>{feedback.fluency_assessment}</p>
                                    </div>
                                )}

                                {hasScore && (
                                    <>
                                        <button className="expand-btn" onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}>
                                            {showDetailedFeedback ? <>Hide Details <ChevronUp size={18} /></> : <>Show Details <ChevronDown size={18} /></>}
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
                                                {feedback.grammar_notes?.length > 0 && (
                                                    <div className="feedback-box grammar">
                                                        <h4>📝 Grammar</h4>
                                                        <ul>{feedback.grammar_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
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

                                {feedback.encouragement && (
                                    <div className="encouragement-box">
                                        <p>💪 {feedback.encouragement}</p>
                                    </div>
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

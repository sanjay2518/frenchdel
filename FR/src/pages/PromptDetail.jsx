import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mic, PenTool, Send, Play, Pause } from 'lucide-react';
import './PromptDetail.css';

const PromptDetail = () => {
    const { promptId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prompt, setPrompt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submission, setSubmission] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [taskProcessed, setTaskProcessed] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);

    useEffect(() => {
        fetchPrompt();
    }, [promptId]);

    const fetchPrompt = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/get-prompts`);
            if (response.ok) {
                const data = await response.json();
                const foundPrompt = data.prompts?.find(p => p.id === promptId);
                setPrompt(foundPrompt || null);
            }
        } catch (error) {
            console.error('Error fetching prompt:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitTask = async () => {
        // For speaking tasks, either audio recording or text notes are required
        // For writing tasks, text content is required
        if (prompt.type === 'speaking') {
            if (!audioBlob && !submission.trim()) {
                alert('Please record audio or provide written notes before submitting.');
                return;
            }
        } else {
            if (!submission.trim()) {
                alert('Please provide your response before submitting.');
                return;
            }
        }

        setSubmitting(true);
        try {
            let audioFileName = null;
            
            // Upload audio file if it exists
            if (audioBlob && prompt.type === 'speaking') {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                const uploadResponse = await fetch('http://localhost:5000/api/uploads/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    audioFileName = uploadData.filename;
                }
            }
            
            const response = await fetch('http://localhost:5000/api/admin/submit-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    promptId: promptId,
                    submission: submission,
                    type: prompt.type,
                    audioFile: audioFileName
                })
            });

            if (response.ok) {
                alert('Task completed successfully!');
                navigate('/practice-prompts');
            } else {
                alert('Failed to submit task. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting task:', error);
            alert('Failed to submit task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="prompt-detail-page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!prompt) {
        return (
            <div className="prompt-detail-page">
                <div className="error-state">
                    <h2>Prompt not found</h2>
                    <Link to="/practice-prompts" className="btn btn-primary">
                        Back to Prompts
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="prompt-detail-page">
            <div className="prompt-container">
                <div className="prompt-header">
                    <Link to="/practice-prompts" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Prompts
                    </Link>
                    <div className="prompt-type">
                        {prompt.type === 'speaking' ? (
                            <><Mic size={20} /> Speaking Task</>
                        ) : (
                            <><PenTool size={20} /> Writing Task</>
                        )}
                    </div>
                </div>

                <div className="prompt-content">
                    <h1>{prompt.title}</h1>
                    <p className="prompt-description">{prompt.description}</p>
                    
                    <div className="prompt-meta">
                        <span>Level: {prompt.level}</span>
                        <span>Difficulty: {prompt.difficulty}</span>
                        {prompt.due_date && (
                            <span>Due: {new Date(prompt.due_date).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>

                <div className="task-area">
                    <h3>Your Response</h3>
                    
                    {prompt.type === 'speaking' ? (
                        <div className="speaking-task">
                            <div className="recording-area">
                                <button 
                                    className={`record-btn ${isRecording ? 'recording' : ''}`}
                                    onClick={async () => {
                                        if (isRecording) {
                                            // Stop recording
                                            if (mediaRecorderRef.current) {
                                                mediaRecorderRef.current.stop();
                                                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                                            }
                                            setIsRecording(false);
                                        } else {
                                            // Start recording
                                            try {
                                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                                mediaRecorderRef.current = new MediaRecorder(stream);
                                                audioChunksRef.current = [];
                                                
                                                mediaRecorderRef.current.ondataavailable = (event) => {
                                                    audioChunksRef.current.push(event.data);
                                                };
                                                
                                                mediaRecorderRef.current.onstop = () => {
                                                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                                                    setAudioBlob(blob);
                                                    const url = URL.createObjectURL(blob);
                                                    setAudioUrl(url);
                                                    setHasRecorded(true);
                                                    setTaskProcessed(true);
                                                };
                                                
                                                mediaRecorderRef.current.start();
                                                setIsRecording(true);
                                            } catch (error) {
                                                alert('Unable to access microphone');
                                            }
                                        }
                                    }}
                                >
                                    <Mic size={24} />
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </button>
                                <p>Click to start recording your response</p>
                                {hasRecorded && (
                                    <div className="audio-controls">
                                        <p className="recording-status">✓ Recording completed</p>
                                        <button 
                                            className="replay-btn"
                                            onClick={() => {
                                                if (audioRef.current) {
                                                    if (isPlaying) {
                                                        audioRef.current.pause();
                                                    } else {
                                                        audioRef.current.play();
                                                    }
                                                    setIsPlaying(!isPlaying);
                                                }
                                            }}
                                        >
                                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                            {isPlaying ? 'Pause' : 'Replay Audio'}
                                        </button>
                                        <audio 
                                            ref={audioRef} 
                                            src={audioUrl} 
                                            onEnded={() => setIsPlaying(false)}
                                        />
                                    </div>
                                )}
                            </div>
                            <textarea
                                placeholder="Or type your speaking notes here..."
                                value={submission}
                                onChange={(e) => {
                                    setSubmission(e.target.value);
                                    if (e.target.value.trim()) {
                                        setTaskProcessed(true);
                                    }
                                }}
                                rows="6"
                            />
                        </div>
                    ) : (
                        <div className="writing-task">
                            <textarea
                                placeholder="Write your response here..."
                                value={submission}
                                onChange={(e) => {
                                    setSubmission(e.target.value);
                                    if (e.target.value.trim()) {
                                        setTaskProcessed(true);
                                    }
                                }}
                                rows="10"
                            />
                        </div>
                    )}

                    <div className="task-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={submitTask}
                            disabled={submitting || !taskProcessed}
                        >
                            <Send size={18} />
                            {submitting ? 'Submitting...' : 'Complete Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptDetail;
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './PracticePrompts.css';

const PracticePrompts = () => {
    const { user } = useAuth();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchPrompts();
        }
    }, [user]);

    const fetchPrompts = async () => {
        if (!user?.id) return;
        
        try {
            console.log('Fetching user prompts from admin endpoint...');
            const response = await fetch(`${API_URL}/api/admin/get-prompts`);
            if (response.ok) {
                const data = await response.json();
                console.log('Admin prompts data:', data);
                
                if (data.success && data.prompts) {
                    // Fetch user submissions to check status
                    const submissionsResponse = await fetch(`${API_URL}/api/submissions`);
                    const submissionsData = await submissionsResponse.json();
                    const userSubmissions = submissionsData.submissions?.filter(s => s.userId === user.id) || [];
                    
                    // Add status based on submissions
                    const userPrompts = data.prompts.map(prompt => {
                        const submission = userSubmissions.find(s => s.promptId === prompt.id);
                        return {
                            ...prompt,
                            status: submission ? 'completed' : 'pending',
                            dueDate: prompt.due_date
                        };
                    });
                    setPrompts(userPrompts);
                } else {
                    setPrompts([]);
                }
            }
        } catch (error) {
            console.error('Error fetching prompts:', error);
            setPrompts([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="practice-prompts-page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="practice-prompts-page">
            <div className="prompts-container">
                <div className="prompts-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Link>
                    <h1>Practice Prompts</h1>
                    <p>Complete tasks assigned by your instructor</p>
                </div>

                {prompts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Target size={48} />
                        </div>
                        <h3>No prompts available</h3>
                        <p>Your instructor hasn't assigned any tasks yet. Check back later!</p>
                    </div>
                ) : (
                    <div className="prompts-grid">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="prompt-card">
                                <div className="prompt-header">
                                    <div className="prompt-type">
                                        <Target size={20} />
                                        <span>{prompt.type}</span>
                                    </div>
                                    <div className={`prompt-status ${prompt.status}`}>
                                        {prompt.status === 'completed' ? (
                                            <CheckCircle size={16} />
                                        ) : (
                                            <Clock size={16} />
                                        )}
                                        <span>{prompt.status}</span>
                                    </div>
                                </div>
                                <h3>{prompt.title}</h3>
                                <p>{prompt.description}</p>
                                <div className="prompt-meta">
                                    <span>Due: {new Date(prompt.dueDate).toLocaleDateString()}</span>
                                    <span>Level: {prompt.level}</span>
                                </div>
                                <div className="prompt-actions">
                                    {prompt.status === 'pending' ? (
                                        <Link 
                                            to={`/practice-prompts/${prompt.id}`} 
                                            className="btn btn-primary"
                                        >
                                            Start Task
                                        </Link>
                                    ) : (
                                        <Link 
                                            to={`/practice-prompts/${prompt.id}`} 
                                            className="btn btn-secondary"
                                        >
                                            View Submission
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticePrompts;
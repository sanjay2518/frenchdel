import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_URL from '../config/api';

const UserDataContext = createContext(null);

export const useUserData = () => {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};

export const UserDataProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user data from localStorage and fetch from backend
    useEffect(() => {
        const loadSubmissions = async () => {
            if (isAuthenticated && user) {
                // First, load from localStorage for quick display
                const storedData = localStorage.getItem(`frenchmaster_data_${user.id}`);
                if (storedData) {
                    const data = JSON.parse(storedData);
                    setSubmissions(data.submissions || []);
                }

                // Then fetch from backend to get latest feedback
                try {
                    const response = await fetch(`${API_URL}/api/user/submissions/${user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.submissions) {
                            // Merge backend data with localStorage (backend has priority for feedback)
                            const backendSubmissions = data.submissions.map(sub => ({
                                id: sub.id,
                                title: sub.title,
                                type: sub.type,
                                status: sub.status,
                                score: sub.score,
                                feedback: sub.feedback,
                                submittedAt: sub.submittedAt,
                                submissionText: sub.submissionText
                            }));
                            setSubmissions(backendSubmissions);
                            // Update localStorage with backend data
                            localStorage.setItem(`frenchmaster_data_${user.id}`, JSON.stringify({
                                submissions: backendSubmissions
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch submissions from backend:', error);
                }
            } else {
                setSubmissions([]);
            }
            setLoading(false);
        };

        loadSubmissions();
    }, [isAuthenticated, user]);

    // Save data to localStorage whenever it changes
    const saveData = (newSubmissions) => {
        if (user) {
            localStorage.setItem(`frenchmaster_data_${user.id}`, JSON.stringify({
                submissions: newSubmissions
            }));
        }
    };

    // Add a new submission
    const addSubmission = (submission) => {
        const newSubmission = {
            id: Date.now(),
            ...submission,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            score: null,
            feedback: null
        };

        const updatedSubmissions = [newSubmission, ...submissions];
        setSubmissions(updatedSubmissions);
        saveData(updatedSubmissions);

        return newSubmission;
    };

    // Send email notification
    const sendEmailNotification = async (userEmail, submissionTitle) => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/send-feedback-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, submission_title: submissionTitle })
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to send email notification:', error);
            return false;
        }
    };

    // Simulate receiving feedback (for demo purposes)
    const receiveFeedback = async (submissionId, score, feedback) => {
        const submission = submissions.find(sub => sub.id === submissionId);
        const updatedSubmissions = submissions.map(sub =>
            sub.id === submissionId
                ? { ...sub, status: 'reviewed', score, feedback, reviewedAt: new Date().toISOString() }
                : sub
        );
        setSubmissions(updatedSubmissions);
        saveData(updatedSubmissions);

        // Send email notification
        if (user?.email && submission) {
            await sendEmailNotification(user.email, submission.title);
        }
    };

    // Delete a submission
    const deleteSubmission = (submissionId) => {
        const updatedSubmissions = submissions.filter(sub => sub.id !== submissionId);
        setSubmissions(updatedSubmissions);
        saveData(updatedSubmissions);
    };

    // Get stats
    const getStats = () => {
        const speakingSubmissions = submissions.filter(s => s.type === 'speaking');
        const writingSubmissions = submissions.filter(s => s.type === 'writing');
        const pendingFeedback = submissions.filter(s => s.status === 'pending');
        const completedFeedback = submissions.filter(s => s.status === 'reviewed');

        return {
            totalSubmissions: submissions.length,
            speakingSubmissions: speakingSubmissions.length,
            writingSubmissions: writingSubmissions.length,
            pendingFeedback: pendingFeedback.length,
            completedFeedback: completedFeedback.length
        };
    };

    // Get recent submissions
    const getRecentSubmissions = (limit = 5) => {
        return submissions.slice(0, limit);
    };

    // Format time ago
    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    // Refresh submissions from backend
    const refreshSubmissions = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/api/user/submissions/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.submissions) {
                    const backendSubmissions = data.submissions.map(sub => ({
                        id: sub.id,
                        title: sub.title,
                        type: sub.type,
                        status: sub.status,
                        score: sub.score,
                        feedback: sub.feedback,
                        submittedAt: sub.submittedAt,
                        submissionText: sub.submissionText
                    }));
                    setSubmissions(backendSubmissions);
                    localStorage.setItem(`frenchmaster_data_${user.id}`, JSON.stringify({
                        submissions: backendSubmissions
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to refresh submissions:', error);
        }
    };

    const value = {
        submissions,
        loading,
        addSubmission,
        receiveFeedback,
        deleteSubmission,
        getStats,
        getRecentSubmissions,
        getTimeAgo,
        sendEmailNotification,
        refreshSubmissions
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
};

export default UserDataContext;

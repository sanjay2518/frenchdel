import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                setError(data.error || 'Failed to send reset email');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-branding">
                        <div className="auth-branding-content">
                            <Link to="/" className="auth-logo">
                                <div className="logo-icon">
                                    <span>🇫🇷</span>
                                </div>
                                <span className="logo-text">FrenchMaster</span>
                            </Link>
                            <h1>Check Your Email</h1>
                            <p>We've sent password reset instructions to your email address.</p>
                        </div>
                        <div className="auth-branding-bg"></div>
                    </div>

                    <div className="auth-form-section">
                        <div className="auth-form-wrapper">
                            <div className="success-message">
                                <CheckCircle size={48} className="success-icon" />
                                <h2>Email Sent Successfully!</h2>
                                <p>
                                    We've sent a password reset link to <strong>{email}</strong>. 
                                    Please check your email and follow the instructions to reset your password.
                                </p>
                                <div className="success-actions">
                                    <Link to="/login" className="btn btn-primary">
                                        <ArrowLeft size={18} />
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-branding">
                    <div className="auth-branding-content">
                        <Link to="/" className="auth-logo">
                            <div className="logo-icon">
                                <span>🇫🇷</span>
                            </div>
                            <span className="logo-text">FrenchMaster</span>
                        </Link>
                        <h1>Forgot Password?</h1>
                        <p>No worries! Enter your email address and we'll send you a link to reset your password.</p>
                    </div>
                    <div className="auth-branding-bg"></div>
                </div>

                <div className="auth-form-section">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Reset Password</h2>
                            <p>Enter your email address to receive reset instructions</p>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="auth-footer-text">
                            Remember your password?{' '}
                            <Link to="/login" className="auth-link">
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
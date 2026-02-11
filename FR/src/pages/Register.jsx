import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Mail, Lock, User, Eye, EyeOff,
    UserPlus, AlertCircle, CheckCircle
} from 'lucide-react';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        };
        return checks;
    };

    const passwordChecks = validatePassword(formData.password);
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordValid) {
            setError('Please ensure your password meets all requirements');
            return;
        }

        if (!agreeTerms) {
            setError('Please agree to the terms and conditions');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Left Side - Branding */}
                <div className="auth-branding">
                    <div className="auth-branding-content">
                        <Link to="/" className="auth-logo">
                            <div className="logo-icon">
                                <span>🇫🇷</span>
                            </div>
                            <span className="logo-text">FrenchMaster</span>
                        </Link>
                        <h1>Start Your Journey</h1>
                        <p>Join thousands of learners mastering French through personalized practice.</p>

                        <div className="auth-features">
                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                <span>Unlimited speaking & writing practice</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                <span>Expert feedback from native speakers</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                <span>Track your progress over time</span>
                            </div>
                        </div>
                    </div>
                    <div className="auth-branding-bg"></div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-section">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Create Account</h2>
                            <p>Fill in your details to get started</p>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <div className="input-with-icon">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            className="form-input"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        className="form-input"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="input-with-icon">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="username"
                                        className="form-input"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {formData.password && (
                                    <div className="password-requirements">
                                        <div className={`requirement ${passwordChecks.length ? 'met' : ''}`}>
                                            <CheckCircle size={14} />
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`requirement ${passwordChecks.uppercase ? 'met' : ''}`}>
                                            <CheckCircle size={14} />
                                            <span>One uppercase letter</span>
                                        </div>
                                        <div className={`requirement ${passwordChecks.lowercase ? 'met' : ''}`}>
                                            <CheckCircle size={14} />
                                            <span>One lowercase letter</span>
                                        </div>
                                        <div className={`requirement ${passwordChecks.number ? 'met' : ''}`}>
                                            <CheckCircle size={14} />
                                            <span>One number</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        className="form-input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span>
                                        I agree to the{' '}
                                        <Link to="/terms" className="auth-link">Terms of Service</Link>
                                        {' '}and{' '}
                                        <Link to="/privacy" className="auth-link">Privacy Policy</Link>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account <UserPlus size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="auth-footer-text">
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

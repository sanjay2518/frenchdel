import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import {
    User, Mail, Calendar, Camera, Edit3,
    Save, X, ArrowLeft, Award, Mic, PenTool,
    TrendingUp, CheckCircle
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { getStats } = useUserData();
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        email: user?.email || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    const stats = getStats();
    const memberSince = new Date(user?.id || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
                updateUser({ profileImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateUser(formData);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            username: user?.username || '',
            email: user?.email || ''
        });
        setIsEditing(false);
    };

    const getInitials = () => {
        const first = user?.firstName?.charAt(0) || '';
        const last = user?.lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <Link to="/dashboard" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <h1>My Profile</h1>
                </div>

                <div className="profile-content">
                    {/* Profile Card */}
                    <div className="profile-card">
                        <div className="profile-card-header">
                            <div className="profile-image-section">
                                <div
                                    className="profile-image-wrapper"
                                    onClick={handleImageClick}
                                >
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="profile-image"
                                        />
                                    ) : (
                                        <div className="profile-initials">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <div className="profile-image-overlay">
                                        <Camera size={24} />
                                        <span>Change Photo</span>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="profile-info">
                                <h2>{user?.firstName} {user?.lastName}</h2>
                                <p className="profile-username">@{user?.username || 'username'}</p>
                                <div className="profile-badges">
                                    <span className="badge badge-learner">
                                        <Award size={14} />
                                        Learner
                                    </span>
                                    {user?.emailVerified && (
                                        <span className="badge badge-verified">
                                            <CheckCircle size={14} />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    className="btn btn-secondary edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit3 size={18} />
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Stats Overview */}
                        <div className="profile-stats">
                            <div className="profile-stat">
                                <div className="stat-icon blue">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="stat-details">
                                    <span className="stat-value">{stats.totalSubmissions}</span>
                                    <span className="stat-label">Total Submissions</span>
                                </div>
                            </div>
                            <div className="profile-stat">
                                <div className="stat-icon purple">
                                    <Mic size={20} />
                                </div>
                                <div className="stat-details">
                                    <span className="stat-value">{stats.speakingSubmissions}</span>
                                    <span className="stat-label">Speaking</span>
                                </div>
                            </div>
                            <div className="profile-stat">
                                <div className="stat-icon pink">
                                    <PenTool size={20} />
                                </div>
                                <div className="stat-details">
                                    <span className="stat-value">{stats.writingSubmissions}</span>
                                    <span className="stat-label">Writing</span>
                                </div>
                            </div>
                            <div className="profile-stat">
                                <div className="stat-icon green">
                                    <CheckCircle size={20} />
                                </div>
                                <div className="stat-details">
                                    <span className="stat-value">{stats.completedFeedback}</span>
                                    <span className="stat-label">Reviewed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="profile-details-card">
                        <div className="card-header">
                            <h3>Account Information</h3>
                            {isEditing && (
                                <div className="edit-actions">
                                    <button
                                        className="btn btn-ghost"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="spinner-small"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="details-grid">
                            <div className="detail-item">
                                <label>
                                    <User size={16} />
                                    First Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                ) : (
                                    <p>{user?.firstName || '-'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>
                                    <User size={16} />
                                    Last Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                ) : (
                                    <p>{user?.lastName || '-'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>
                                    <User size={16} />
                                    Username
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                ) : (
                                    <p>@{user?.username || '-'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                ) : (
                                    <p>{user?.email || '-'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>
                                    <Calendar size={16} />
                                    Member Since
                                </label>
                                <p>{memberSince}</p>
                            </div>

                            <div className="detail-item">
                                <label>
                                    <Award size={16} />
                                    Account Type
                                </label>
                                <div className="subscription-info">
                                    <p>{user?.subscription?.type?.charAt(0).toUpperCase() + user?.subscription?.type?.slice(1) || 'Free'} Account</p>
                                    {user?.subscription?.type === 'premium' && (
                                        <span className="subscription-status active">
                                            Active until {new Date(user.subscription.expiresAt).toLocaleDateString()}
                                        </span>
                                    )}
                                    {(!user?.subscription || user?.subscription?.type === 'free') && (
                                        <Link to="/pricing" className="upgrade-link">
                                            Upgrade to Premium
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

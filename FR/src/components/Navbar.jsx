import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Menu, X, ChevronDown, User, LogOut,
    LayoutDashboard, BookOpen
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleNavClick = (to) => {
        if (location.pathname === to) {
            window.location.reload();
        }
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' },
        { to: '/how-it-works', label: 'How It Works' },
        { to: '/contact', label: 'Contact' }
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo" onClick={() => handleNavClick('/')}>
                    <div className="logo-icon">
                        <span className="logo-letters">FR</span>
                    </div>
                    <span className="logo-text">FrenchMaster</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
                            onClick={() => handleNavClick(link.to)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Auth Buttons / User Menu */}
                <div className="navbar-actions">
                    {isAuthenticated ? (
                        <div className="user-menu-wrapper">
                            <button
                                className="user-menu-trigger"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <div className="user-avatar">
                                    {user?.firstName?.charAt(0) || 'U'}
                                </div>
                                <span className="user-name">{user?.firstName}</span>
                                <ChevronDown size={16} className={`chevron ${isUserMenuOpen ? 'rotated' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                                        <p className="dropdown-email">{user?.email}</p>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <Link to="/dashboard" className="dropdown-item">
                                        <LayoutDashboard size={18} />
                                        Dashboard
                                    </Link>
                                    <Link to="/practice" className="dropdown-item">
                                        <BookOpen size={18} />
                                        Practice
                                    </Link>
                                    <Link to="/profile" className="dropdown-item">
                                        <User size={18} />
                                        Profile
                                    </Link>

                                    <div className="dropdown-divider" />
                                    <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary">
                                Get Started
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="mobile-menu">
                    <div className="mobile-menu-links">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`mobile-link ${location.pathname === link.to ? 'active' : ''}`}
                                onClick={() => handleNavClick(link.to)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="mobile-menu-auth">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="btn btn-secondary btn-block">
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout} className="btn btn-ghost btn-block">
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary btn-block">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary btn-block">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

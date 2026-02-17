import { Link } from 'react-router-dom';
import {
    Facebook, Twitter, Instagram, Linkedin,
    Mail, MapPin, Phone, Heart
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-wave">
                <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path
                        d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z"
                        fill="currentColor"
                    />
                </svg>
            </div>

            <div className="footer-content">
                <div className="container">
                    <div className="footer-grid">
                        {/* Brand Column */}
                        <div className="footer-brand">
                            <Link to="/" className="footer-logo">
                                <div className="logo-icon">
                                    <span className="logo-letters">FR</span>
                                </div>
                                <span className="logo-text">FrenchMaster</span>
                            </Link>
                            <p className="footer-description">
                                Master French through personalized speaking and writing practice
                                with expert feedback. Join thousands of learners on their journey
                                to fluency.
                            </p>
                            <div className="footer-social">
                                <a href="#" className="social-link" aria-label="Facebook">
                                    <Facebook size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="Twitter">
                                    <Twitter size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="Instagram">
                                    <Instagram size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="LinkedIn">
                                    <Linkedin size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="footer-column">
                            <h4 className="footer-title">Quick Links</h4>
                            <ul className="footer-links">
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/how-it-works">How It Works</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Practice */}
                        <div className="footer-column">
                            <h4 className="footer-title">Practice</h4>
                            <ul className="footer-links">
                                <li><Link to="/practice/speaking">Speaking Practice</Link></li>
                                <li><Link to="/practice/pronunciation">Pronunciation Practice</Link></li>
                                <li><Link to="/practice/writing">Writing Practice</Link></li>
                                <li><Link to="/dashboard">My Dashboard</Link></li>
                                <li><Link to="/dashboard/submissions">My Submissions</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className="footer-column">
                            <h4 className="footer-title">Contact Us</h4>
                            <ul className="footer-contact">
                                <li>
                                    <Mail size={18} />
                                    <span>hello@frenchmaster.com</span>
                                </li>
                                <li>
                                    <Phone size={18} />
                                    <span>+1 (555) 123-4567</span>
                                </li>
                                <li>
                                    <MapPin size={18} />
                                    <span>Paris, France</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-bottom-content">
                        <p className="copyright">
                            © {currentYear} FrenchMaster. Made with <Heart size={14} className="heart" /> for language learners.
                        </p>
                        <div className="footer-legal">
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/terms">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import { useState } from 'react';
import {
    Mail, Phone, MapPin, Send,
    Sparkles, Clock, MessageCircle
} from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });

        // Reset after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
    };

    const contactInfo = [
        {
            icon: <Mail size={24} />,
            title: 'Email Us',
            content: 'hello@frenchmaster.com',
            subtext: 'We reply within 24 hours'
        },
        {
            icon: <Phone size={24} />,
            title: 'Call Us',
            content: '+1 (555) 123-4567',
            subtext: 'Mon-Fri, 9am-6pm EST'
        },
        {
            icon: <MapPin size={24} />,
            title: 'Visit Us',
            content: 'Paris, France',
            subtext: 'By appointment only'
        }
    ];

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-bg"></div>
                <div className="container">
                    <div className="contact-hero-content animate-slide-up">
                        <span className="section-badge">
                            <Sparkles size={16} />
                            Contact
                        </span>
                        <h1>Get in <span className="text-gradient">Touch</span></h1>
                        <p>
                            Have questions about FrenchMaster? We'd love to hear from you.
                            Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Info */}
                        <div className="contact-info animate-slide-up">
                            <h2>Let's Start a Conversation</h2>
                            <p>
                                Whether you have questions about our plans, need help with your account,
                                or just want to say hello, we're here for you.
                            </p>

                            <div className="contact-info-cards">
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="contact-info-card">
                                        <div className="contact-info-icon">
                                            {info.icon}
                                        </div>
                                        <div className="contact-info-content">
                                            <h4>{info.title}</h4>
                                            <p className="contact-info-main">{info.content}</p>
                                            <p className="contact-info-sub">{info.subtext}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="contact-hours">
                                <Clock size={20} />
                                <div>
                                    <h4>Business Hours</h4>
                                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                                    <p>Saturday - Sunday: Closed</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-wrapper animate-slide-up stagger-2">
                            <div className="contact-form-card">
                                <div className="form-header">
                                    <MessageCircle size={24} />
                                    <h3>Send Us a Message</h3>
                                </div>

                                {submitted ? (
                                    <div className="success-message">
                                        <div className="success-icon">✓</div>
                                        <h4>Message Sent!</h4>
                                        <p>Thank you for reaching out. We'll get back to you soon.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Your Name *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="form-input"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email Address *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-input"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Subject</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                className="form-input"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="How can we help?"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Message *</label>
                                            <textarea
                                                name="message"
                                                className="form-textarea"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Tell us more about your inquiry..."
                                                rows={5}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-block"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-small"></span>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message <Send size={18} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;

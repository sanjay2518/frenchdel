import { Link } from 'react-router-dom';
import {
    UserPlus, BookOpen, Mic, PenTool,
    Send, MessageSquare, TrendingUp, ArrowRight,
    CheckCircle, Sparkles
} from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
    const steps = [
        {
            number: 1,
            icon: <UserPlus size={32} />,
            title: 'Create Your Account',
            description: 'Sign up in seconds and choose a subscription plan that fits your learning goals.',
            details: [
                'Quick and easy registration',
                'Choose monthly, quarterly, or yearly plan',
                'Access to all practice materials immediately'
            ]
        },
        {
            number: 2,
            icon: <BookOpen size={32} />,
            title: 'Choose a Practice Prompt',
            description: 'Browse our library of speaking and writing prompts designed for all skill levels.',
            details: [
                'Beginner, intermediate, and advanced levels',
                'Topics covering everyday situations',
                'New prompts added regularly'
            ]
        },
        {
            number: 3,
            icon: <Mic size={32} />,
            title: 'Complete Your Practice',
            description: 'Record your voice for speaking practice or write your response for writing practice.',
            details: [
                'Easy-to-use audio recorder',
                'Comfortable writing interface',
                'Save drafts and submit when ready'
            ]
        },
        {
            number: 4,
            icon: <Send size={32} />,
            title: 'Submit for Review',
            description: 'Submit your practice for review by our expert French instructors.',
            details: [
                'Secure file handling',
                'Confirmation of submission',
                'Track status in your dashboard'
            ]
        },
        {
            number: 5,
            icon: <MessageSquare size={32} />,
            title: 'Receive Expert Feedback',
            description: 'Get detailed, personalized feedback from native French speakers within 24 hours.',
            details: [
                'Pronunciation corrections for speaking',
                'Grammar and style suggestions for writing',
                'Tips for improvement'
            ]
        },
        {
            number: 6,
            icon: <TrendingUp size={32} />,
            title: 'Track Your Progress',
            description: 'Monitor your improvement over time and celebrate your achievements.',
            details: [
                'View all past submissions and feedback',
                'See your improvement trends',
                'Set and achieve learning goals'
            ]
        }
    ];

    const practiceTypes = [
        {
            type: 'Speaking Practice',
            icon: <Mic size={40} />,
            description: 'Speak freely in French and get comprehensive AI analysis',
            features: [
                'Speak freely about any topic in French',
                'Real-time speech-to-text transcription',
                'Get grammar, fluency & vocabulary feedback',
                'Instant AI-powered analysis'
            ],
            color: 'blue'
        },
        {
            type: 'Writing Practice',
            icon: <PenTool size={40} />,
            description: 'Perfect your French grammar and writing style',
            features: [
                'Write responses to engaging prompts',
                'Get grammar corrections',
                'Improve vocabulary usage',
                'Learn proper French style'
            ],
            color: 'purple'
        }
    ];

    return (
        <div className="how-it-works-page">
            {/* Hero Section */}
            <section className="hiw-hero">
                <div className="hiw-hero-bg"></div>
                <div className="container">
                    <div className="hiw-hero-content animate-slide-up">
                        <span className="section-badge">
                            <Sparkles size={16} />
                            How It Works
                        </span>
                        <h1>Your Path to <span className="text-gradient">French Fluency</span></h1>
                        <p>
                            A simple, effective approach to mastering French through
                            personalized practice and expert feedback.
                        </p>
                    </div>
                </div>
            </section>

            {/* Practice Types Section */}
            <section className="practice-types-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Practice Modules</span>
                        <h2>Two Ways to Practice</h2>
                        <p>Choose speaking or writing practice based on your learning goals</p>
                    </div>

                    <div className="practice-types-grid">
                        {practiceTypes.map((practice, index) => (
                            <div
                                key={index}
                                className={`practice-type-card practice-${practice.color} animate-slide-up`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="practice-type-icon">
                                    {practice.icon}
                                </div>
                                <h3>{practice.type}</h3>
                                <p className="practice-type-desc">{practice.description}</p>
                                <ul className="practice-features">
                                    {practice.features.map((feature, i) => (
                                        <li key={i}>
                                            <CheckCircle size={18} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="steps-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Step by Step</span>
                        <h2>How to Get Started</h2>
                        <p>Follow these simple steps to begin your French learning journey</p>
                    </div>

                    <div className="steps-timeline">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'} animate-slide-up`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="timeline-marker">
                                    <span>{step.number}</span>
                                </div>
                                <div className="timeline-card">
                                    <div className="timeline-icon">
                                        {step.icon}
                                    </div>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                    <ul className="timeline-details">
                                        {step.details.map((detail, i) => (
                                            <li key={i}>
                                                <CheckCircle size={16} />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="hiw-cta section">
                <div className="container">
                    <div className="hiw-cta-card">
                        <div className="cta-content text-center">
                            <h2>Ready to Start Learning?</h2>
                            <p>Join thousands of learners improving their French every day</p>
                            <div className="cta-actions">
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Start Learning Free <ArrowRight size={20} />
                                </Link>
                                <Link to="/contact" className="btn btn-secondary btn-lg">
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorks;

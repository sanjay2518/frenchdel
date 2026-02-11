import { Link } from 'react-router-dom';
import {
    Mic, PenTool, MessageSquare, Award,
    Users, Clock, CheckCircle, ArrowRight,
    Star, Play, Sparkles, Globe
} from 'lucide-react';
import './Home.css';

const Home = () => {
    const features = [
        {
            icon: <Mic size={28} />,
            title: 'Speaking Practice',
            description: 'Record your voice and receive detailed pronunciation feedback from expert instructors.',
            color: 'blue'
        },
        {
            icon: <PenTool size={28} />,
            title: 'Writing Practice',
            description: 'Submit your written French and get comprehensive grammar and style corrections.',
            color: 'purple'
        },
        {
            icon: <MessageSquare size={28} />,
            title: 'Expert Feedback',
            description: 'Personalized feedback from native French speakers within 24 hours.',
            color: 'pink'
        },
        {
            icon: <Award size={28} />,
            title: 'Track Progress',
            description: 'Monitor your improvement with detailed progress reports and analytics.',
            color: 'orange'
        }
    ];

    const testimonials = [
        {
            name: 'Sophie Laurent',
            role: 'Language Enthusiast',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            content: 'FrenchMaster transformed my French learning journey. The personalized feedback helped me improve my pronunciation dramatically!',
            rating: 5
        },
        {
            name: 'James Wilson',
            role: 'Business Professional',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            content: 'The writing practice feature is incredible. I went from struggling with basic sentences to writing professional emails.',
            rating: 5
        },
        {
            name: 'Maria Garcia',
            role: 'University Student',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            content: 'Affordable, effective, and the instructors are amazing. Best investment in my French education!',
            rating: 5
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Choose Your Practice',
            description: 'Select speaking or writing practice based on your learning goals.'
        },
        {
            number: '02',
            title: 'Complete the Task',
            description: 'Record your voice or write your response to engaging prompts.'
        },
        {
            number: '03',
            title: 'Get Expert Feedback',
            description: 'Receive detailed corrections and suggestions within 24 hours.'
        },
        {
            number: '04',
            title: 'Improve & Repeat',
            description: 'Apply the feedback and track your progress over time.'
        }
    ];

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-pattern"></div>
                    <div className="floating-elements">
                        <div className="floating-circle circle-1"></div>
                        <div className="floating-circle circle-2"></div>
                        <div className="floating-circle circle-3"></div>
                    </div>
                </div>

                <div className="container hero-container">
                    <div className="hero-content animate-slide-up">
                        <div className="hero-badge">
                            <Sparkles size={16} />
                            <span>The #1 French Learning Platform</span>
                        </div>

                        <h1 className="hero-title">
                            Master French with
                            <span className="text-gradient"> Personalized</span>
                            <br />Speaking & Writing Practice
                        </h1>

                        <p className="hero-description">
                            Get expert feedback on your French speaking and writing from native instructors.
                            Join thousands of learners improving their French every day.
                        </p>

                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Start Learning Free
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/how-it-works" className="btn btn-secondary btn-lg">
                                <Play size={20} />
                                See How It Works
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual animate-slide-up stagger-2">
                        <div className="hero-card hero-card-main">
                            <div className="card-header">
                                <div className="status-dot"></div>
                                <span>Live Practice Session</span>
                            </div>
                            <div className="card-content">
                                <div className="waveform">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="wave-bar"
                                            style={{
                                                height: `${Math.random() * 60 + 20}%`,
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                                <p className="transcript">"Bonjour, je m'appelle..."</p>
                            </div>
                        </div>

                        <div className="hero-card hero-card-feedback animate-float">
                            <div className="feedback-icon">
                                <CheckCircle size={24} />
                            </div>
                            <div className="feedback-content">
                                <h4>Feedback Ready!</h4>
                                <p>Your submission has been reviewed</p>
                            </div>
                        </div>

                        <div className="hero-card hero-card-score animate-float" style={{ animationDelay: '1s' }}>
                            <div className="score-ring">
                                <svg viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="3"
                                        strokeDasharray="92, 100"
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#667eea" />
                                            <stop offset="100%" stopColor="#764ba2" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <span className="score-value">92</span>
                            </div>
                            <span className="score-label">Fluency Score</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Features</span>
                        <h2>Everything You Need to Master French</h2>
                        <p>Comprehensive tools and expert guidance for your French learning journey</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`feature-card feature-${feature.color} animate-slide-up`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <Link to="/register" className="feature-link">
                                    Learn more <ArrowRight size={16} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">How It Works</span>
                        <h2>Your Path to French Fluency</h2>
                        <p>Simple steps to start your learning journey</p>
                    </div>

                    <div className="steps-container">
                        <div className="steps-line"></div>
                        <div className="steps-grid">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="step-card animate-slide-up"
                                    style={{ animationDelay: `${index * 0.15}s` }}
                                >
                                    <div className="step-number">{step.number}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center" style={{ marginTop: '3rem' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Now <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Testimonials</span>
                        <h2>Loved by Thousands of Learners</h2>
                        <p>See what our community has to say about FrenchMaster</p>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="testimonial-card animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div
                                    className="testimonial-rating"
                                    role="img"
                                    aria-label={`${testimonial.rating} out of 5 stars`}
                                >
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={18} fill="#fbbf24" color="#fbbf24" aria-hidden="true" />
                                    ))}
                                </div>
                                <p className="testimonial-content">"{testimonial.content}"</p>
                                <div className="testimonial-author">
                                    <img src={testimonial.image} alt={`Photo of ${testimonial.name}`} />
                                    <div>
                                        <h4>{testimonial.name}</h4>
                                        <span>{testimonial.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-bg">
                    <div className="cta-gradient"></div>
                </div>
                <div className="container">
                    <div className="cta-content text-center">
                        <Globe size={48} className="cta-icon animate-float" />
                        <h2>Ready to Start Your French Journey?</h2>
                        <p>Join FrenchMaster today and take the first step towards fluency</p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Start Learning Free <ArrowRight size={20} />
                            </Link>
                            <Link to="/how-it-works" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

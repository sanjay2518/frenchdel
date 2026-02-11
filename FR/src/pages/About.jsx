import { Link } from 'react-router-dom';
import {
    Target, Heart, Users, Award,
    Sparkles, Globe, BookOpen, ArrowRight
} from 'lucide-react';
import './About.css';

const About = () => {
    const values = [
        {
            icon: <Target size={28} />,
            title: 'Mission-Driven',
            description: 'We believe everyone deserves access to quality language education without barriers.'
        },
        {
            icon: <Heart size={28} />,
            title: 'Learner-Focused',
            description: 'Every feature we build starts with understanding what our learners truly need.'
        },
        {
            icon: <Users size={28} />,
            title: 'Community',
            description: 'Learning is better together. We foster a supportive community of French enthusiasts.'
        },
        {
            icon: <Award size={28} />,
            title: 'Excellence',
            description: 'We maintain the highest standards in feedback quality and platform experience.'
        }
    ];

    const team = [
        {
            name: 'Marie Dubois',
            role: 'Founder & CEO',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
            bio: 'Former French professor with 15 years of teaching experience.'
        },
        {
            name: 'Pierre Laurent',
            role: 'Head of Curriculum',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
            bio: 'Language acquisition specialist and published author.'
        },
        {
            name: 'Claire Martin',
            role: 'Lead Instructor',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
            bio: 'Native French speaker passionate about helping students succeed.'
        }
    ];

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-bg"></div>
                <div className="container">
                    <div className="about-hero-content animate-slide-up">
                        <span className="section-badge">
                            <Sparkles size={16} />
                            About Us
                        </span>
                        <h1>Making French Fluency <span className="text-gradient">Accessible</span> to Everyone</h1>
                        <p>
                            We're on a mission to revolutionize how people learn French through
                            personalized feedback and modern technology.
                        </p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section section">
                <div className="container">
                    <div className="story-grid">
                        <div className="story-image animate-slide-up">
                            <img
                                src="https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600"
                                alt="Paris, France"
                            />
                            <div className="story-badge">
                                <Globe size={24} />
                                <span>Paris, France</span>
                            </div>
                        </div>
                        <div className="story-content animate-slide-up stagger-2">
                            <span className="section-badge">Our Story</span>
                            <h2>Born from a Passion for French</h2>
                            <p>
                                FrenchMaster began in 2020 when our founder, Marie Dubois, noticed a gap
                                in online language learning. While there were plenty of apps for vocabulary
                                and grammar, none offered the personalized speaking and writing feedback
                                that truly accelerates fluency.
                            </p>
                            <p>
                                Drawing from her 15 years of teaching experience, Marie built FrenchMaster
                                to provide the kind of individualized attention students need—but at a
                                fraction of the cost of private tutoring.
                            </p>
                            <p>
                                Today, we've helped over 10,000 learners improve their French, and we're
                                just getting started. Our team of native French speakers and language
                                experts is committed to helping you achieve your fluency goals.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Our Values</span>
                        <h2>What Drives Us Every Day</h2>
                        <p>The principles that guide everything we do</p>
                    </div>

                    <div className="values-grid">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="value-card animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="value-icon">
                                    {value.icon}
                                </div>
                                <h3>{value.title}</h3>
                                <p>{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Our Team</span>
                        <h2>Meet the People Behind FrenchMaster</h2>
                        <p>Native speakers and language experts dedicated to your success</p>
                    </div>

                    <div className="team-grid">
                        {team.map((member, index) => (
                            <div
                                key={index}
                                className="team-card animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="team-image">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <div className="team-info">
                                    <h3>{member.name}</h3>
                                    <span className="team-role">{member.role}</span>
                                    <p>{member.bio}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="about-cta section">
                <div className="container">
                    <div className="about-cta-card">
                        <div className="cta-content">
                            <BookOpen size={40} className="cta-icon" />
                            <h2>Ready to Start Your French Journey?</h2>
                            <p>Join our community of learners and take the first step towards fluency today.</p>
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Get Started Free <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;

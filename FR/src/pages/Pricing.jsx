import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Check, X, Sparkles, ArrowRight,
    HelpCircle, ChevronDown
} from 'lucide-react';
import './Pricing.css';

const Pricing = () => {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [openFaq, setOpenFaq] = useState(null);

    const plans = [
        {
            id: 'monthly',
            name: 'Monthly',
            price: 29.99,
            period: 'month',
            description: 'Perfect for trying out FrenchMaster',
            features: [
                { text: 'Unlimited speaking practice', included: true },
                { text: 'Unlimited writing practice', included: true },
                { text: 'Expert feedback within 24 hours', included: true },
                { text: 'Progress tracking dashboard', included: true },
                { text: 'Email support', included: true },
                { text: 'Priority feedback', included: false },
                { text: 'Personalized learning path', included: false },
                { text: 'One-on-one consultation', included: false }
            ],
            popular: false
        },
        {
            id: 'quarterly',
            name: 'Quarterly',
            price: 79.99,
            monthlyPrice: 26.66,
            period: 'quarter',
            savings: '11%',
            description: 'Best value for committed learners',
            features: [
                { text: 'Unlimited speaking practice', included: true },
                { text: 'Unlimited writing practice', included: true },
                { text: 'Priority feedback within 12 hours', included: true },
                { text: 'Progress tracking dashboard', included: true },
                { text: 'Priority email support', included: true },
                { text: 'Personalized learning path', included: true },
                { text: 'Monthly progress reports', included: true },
                { text: 'One-on-one consultation', included: false }
            ],
            popular: true
        },
        {
            id: 'yearly',
            name: 'Yearly',
            price: 249.99,
            monthlyPrice: 20.83,
            period: 'year',
            savings: '30%',
            description: 'Maximum commitment, maximum results',
            features: [
                { text: 'Unlimited speaking practice', included: true },
                { text: 'Unlimited writing practice', included: true },
                { text: 'VIP feedback within 6 hours', included: true },
                { text: 'Progress tracking dashboard', included: true },
                { text: 'Phone & email support', included: true },
                { text: 'Personalized learning path', included: true },
                { text: 'Weekly progress reports', included: true },
                { text: 'Monthly one-on-one consultation', included: true }
            ],
            popular: false
        }
    ];

    const faqs = [
        {
            question: 'Can I switch plans later?',
            answer: 'Yes! You can upgrade or downgrade your plan at any time. If you upgrade, you\'ll be charged the prorated difference. If you downgrade, the change will take effect at your next billing cycle.'
        },
        {
            question: 'How does the feedback process work?',
            answer: 'After you submit your speaking or writing practice, our team of native French instructors reviews your work. They provide detailed feedback on pronunciation, grammar, vocabulary, and style, along with tips for improvement.'
        },
        {
            question: 'What if I\'m not satisfied?',
            answer: 'We offer a 7-day money-back guarantee. If you\'re not completely satisfied with FrenchMaster within the first 7 days, we\'ll give you a full refund, no questions asked.'
        },
        {
            question: 'Are there any limits on submissions?',
            answer: 'No! All plans include unlimited speaking and writing practice submissions. Practice as much as you want to accelerate your learning.'
        },
        {
            question: 'Do you offer team or enterprise plans?',
            answer: 'Yes, we offer special pricing for teams, schools, and enterprises. Contact us at enterprise@frenchmaster.com for custom solutions.'
        }
    ];

    return (
        <div className="pricing-page">
            {/* Hero Section */}
            <section className="pricing-hero">
                <div className="pricing-hero-bg"></div>
                <div className="container">
                    <div className="pricing-hero-content animate-slide-up">
                        <span className="section-badge">
                            <Sparkles size={16} />
                            Pricing
                        </span>
                        <h1>Choose Your <span className="text-gradient">Learning Plan</span></h1>
                        <p>
                            Flexible pricing options to fit your budget and learning goals.
                            Start with our 7-day money-back guarantee.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pricing-cards-section section">
                <div className="container">
                    <div className="pricing-grid">
                        {plans.map((plan, index) => (
                            <div
                                key={plan.id}
                                className={`pricing-card ${plan.popular ? 'popular' : ''} animate-slide-up`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {plan.popular && (
                                    <div className="popular-badge">Most Popular</div>
                                )}
                                <div className="pricing-header">
                                    <h3>{plan.name}</h3>
                                    <p className="pricing-description">{plan.description}</p>
                                </div>
                                <div className="pricing-amount">
                                    <span className="currency">$</span>
                                    <span className="price">{plan.price}</span>
                                    <span className="period">/{plan.period}</span>
                                </div>
                                {plan.monthlyPrice && (
                                    <p className="monthly-price">
                                        ${plan.monthlyPrice}/month • Save {plan.savings}
                                    </p>
                                )}
                                <Link
                                    to="/register"
                                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-block`}
                                >
                                    Get Started <ArrowRight size={18} />
                                </Link>
                                <ul className="pricing-features">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={feature.included ? 'included' : 'excluded'}>
                                            {feature.included ? (
                                                <Check size={18} />
                                            ) : (
                                                <X size={18} />
                                            )}
                                            <span>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">
                            <HelpCircle size={16} />
                            FAQ
                        </span>
                        <h2>Frequently Asked Questions</h2>
                        <p>Got questions? We've got answers.</p>
                    </div>

                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                            >
                                <button
                                    className="faq-question"
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown size={20} className="faq-icon" />
                                </button>
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pricing-cta section">
                <div className="container">
                    <div className="pricing-cta-card">
                        <div className="cta-content text-center">
                            <h2>Still Have Questions?</h2>
                            <p>Our team is here to help you choose the right plan for your needs.</p>
                            <Link to="/contact" className="btn btn-primary btn-lg">
                                Contact Us <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;

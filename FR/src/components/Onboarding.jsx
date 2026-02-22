import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    X, ChevronRight, ChevronLeft, Mic, PenTool,
    BookOpen, Target, Award, Sparkles, Check,
    Eye, AlertCircle, Lightbulb, BarChart3
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = ({ onComplete, userName }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps = [
        {
            icon: <Sparkles size={48} />,
            title: `Bienvenue! 🎉`,
            description: 'Welcome to your French learning journey. This guide will walk you through the tools available to help you practice and improve your French.',
            features: [
                { icon: <PenTool size={18} />, text: 'Writing Practice — compose texts on various prompts' },
                { icon: <Mic size={18} />, text: 'Speaking Practice — record yourself speaking in French' },
                { icon: <BookOpen size={18} />, text: 'Pronunciation Practice — improve your accent and diction' }
            ]
        },
        {
            icon: <PenTool size={48} />,
            title: 'How to Practice',
            description: 'Follow these simple steps to get started with any practice mode.',
            features: [
                { icon: <Target size={18} />, text: 'Pick a prompt from the available topics' },
                { icon: <PenTool size={18} />, text: 'Write or speak your response in French' },
                { icon: <Check size={18} />, text: 'Submit to receive instant AI feedback' }
            ]
        },
        {
            icon: <Eye size={48} />,
            title: 'Understanding Your Feedback',
            description: 'After submitting, you receive structured AI feedback designed to help you learn efficiently.',
            features: [
                { icon: <Eye size={18} />, text: 'Side-by-side comparison: your text vs corrected version' },
                { icon: <AlertCircle size={18} />, text: 'Color-coded error labels: Grammar, Tense, Vocabulary, etc.' },
                { icon: <Lightbulb size={18} />, text: 'Expandable explanations with grammar rules and examples' }
            ]
        },
        {
            icon: <BarChart3 size={48} />,
            title: 'Track Your Progress',
            description: 'Your submissions and progress are saved automatically.',
            features: [
                { icon: <BarChart3 size={18} />, text: 'View past submissions and scores on the Dashboard' },
                { icon: <Target size={18} />, text: 'Track common error types (tense, grammar, vocabulary)' },
                { icon: <Award size={18} />, text: 'Monitor improvement over time in the Progress page' }
            ]
        },
        {
            icon: <Award size={48} />,
            title: 'Ready to Begin!',
            description: 'You are all set. Start practicing and improving your French today.',
            features: [
                { icon: <Check size={18} />, text: 'Write at least 2-3 sentences for best feedback' },
                { icon: <Check size={18} />, text: 'Use Chrome or Edge for speech recognition' },
                { icon: <Check size={18} />, text: 'Review corrections carefully and re-submit to practice' }
            ]
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('onboardingCompleted', 'true');
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <button className="onboarding-close" onClick={handleSkip}>
                    <X size={20} />
                </button>

                <div className="onboarding-content">
                    <div className="onboarding-icon">{step.icon}</div>
                    <h2 className="onboarding-title">{step.title}</h2>
                    <p className="onboarding-description">{step.description}</p>

                    {step.features && (
                        <div className="onboarding-features">
                            {step.features.map((feature, index) => (
                                <div key={index} className="onboarding-feature">
                                    <div className="feature-icon">{feature.icon}</div>
                                    <span className="feature-text">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress dots */}
                <div className="onboarding-dots">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(index)}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="onboarding-nav">
                    {currentStep > 0 ? (
                        <button className="nav-btn prev" onClick={handlePrev}>
                            <ChevronLeft size={18} /> Back
                        </button>
                    ) : (
                        <button className="nav-btn skip" onClick={handleSkip}>
                            Skip
                        </button>
                    )}

                    <button className="nav-btn next" onClick={handleNext}>
                        {currentStep === steps.length - 1 ? (
                            <>Start Practicing <Check size={18} /></>
                        ) : (
                            <>Next <ChevronRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;

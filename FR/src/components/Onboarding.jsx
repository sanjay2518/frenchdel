import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    X, ChevronRight, ChevronLeft, Mic, PenTool,
    BookOpen, Target, Award, Sparkles, Check
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = ({ onComplete, userName }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps = [
        {
            icon: <Sparkles size={48} />,
            title: `Bienvenue, ${userName || 'Learner'}! 🎉`,
            description: "Welcome to FrenchMaster! We're excited to help you master French. Let's take a quick tour of what you can do here.",
            color: 'primary'
        },
        {
            icon: <BookOpen size={48} />,
            title: 'Structured Lessons',
            description: 'Start with our carefully designed lessons that take you from Beginner to Advanced level. Each lesson builds on the previous one.',
            link: '/lessons',
            linkText: 'View Lessons',
            color: 'green'
        },
        {
            icon: <Mic size={48} />,
            title: 'Speaking Practice',
            description: 'Speak freely in French about anything and get instant AI-powered feedback on your grammar, fluency, vocabulary, and pronunciation.',
            link: '/practice/speaking',
            linkText: 'Try Speaking',
            color: 'blue'
        },
        {
            icon: <PenTool size={48} />,
            title: 'Writing Practice',
            description: 'Write responses in French and receive detailed corrections with explanations to improve your writing skills.',
            link: '/practice/writing',
            linkText: 'Try Writing',
            color: 'purple'
        },
        {
            icon: <Target size={48} />,
            title: 'Track Your Progress',
            description: 'Monitor your improvement with our progress tracker. See your streaks, achievements, and skill breakdown.',
            link: '/progress',
            linkText: 'View Progress',
            color: 'orange'
        },
        {
            icon: <Award size={48} />,
            title: "You're All Set! 🚀",
            description: 'Start your French journey now. We recommend beginning with a lesson or jumping straight into practice.',
            color: 'primary',
            isFinal: true
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        // Save that user has completed onboarding
        localStorage.setItem('onboardingCompleted', 'true');
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        setIsVisible(false);
        localStorage.setItem('onboardingCompleted', 'true');
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];

    return (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
            <div className="onboarding-modal">
                {/* Skip button */}
                <button
                    className="onboarding-skip"
                    onClick={handleSkip}
                    aria-label="Skip onboarding"
                >
                    <X size={20} />
                </button>

                {/* Progress dots */}
                <div className="onboarding-progress" role="tablist" aria-label="Onboarding steps">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(index)}
                            aria-label={`Step ${index + 1} of ${steps.length}`}
                            aria-selected={index === currentStep}
                            role="tab"
                        >
                            {index < currentStep && <Check size={10} />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="onboarding-content">
                    <div className={`onboarding-icon ${currentStepData.color}`}>
                        {currentStepData.icon}
                    </div>

                    <h2 id="onboarding-title">{currentStepData.title}</h2>
                    <p>{currentStepData.description}</p>

                    {currentStepData.link && (
                        <Link
                            to={currentStepData.link}
                            className="onboarding-feature-link"
                            onClick={handleComplete}
                        >
                            {currentStepData.linkText}
                            <ChevronRight size={16} />
                        </Link>
                    )}
                </div>

                {/* Navigation */}
                <div className="onboarding-actions">
                    {currentStep > 0 && (
                        <button
                            className="btn btn-secondary"
                            onClick={handlePrev}
                            aria-label="Previous step"
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    )}

                    {currentStep === 0 && (
                        <button
                            className="btn btn-ghost"
                            onClick={handleSkip}
                        >
                            Skip Tour
                        </button>
                    )}

                    {currentStepData.isFinal ? (
                        <Link
                            to="/lessons"
                            className="btn btn-primary"
                            onClick={handleComplete}
                        >
                            Start Learning
                            <ChevronRight size={18} />
                        </Link>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            aria-label="Next step"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>

                {/* Step counter */}
                <div className="onboarding-step-counter" aria-live="polite">
                    Step {currentStep + 1} of {steps.length}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;

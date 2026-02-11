/**
 * Language Configuration
 * This file provides a foundation for multi-language support.
 * Currently configured for French, but designed to easily add new languages.
 */

// Available languages
export const SUPPORTED_LANGUAGES = {
    french: {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        speechRecognitionCode: 'fr-FR',
        enabled: true
    },
    spanish: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        speechRecognitionCode: 'es-ES',
        enabled: false // Ready to enable when content is available
    },
    german: {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        speechRecognitionCode: 'de-DE',
        enabled: false
    },
    italian: {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        flag: '🇮🇹',
        speechRecognitionCode: 'it-IT',
        enabled: false
    },
    portuguese: {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇧🇷',
        speechRecognitionCode: 'pt-BR',
        enabled: false
    }
};

// Default language
export const DEFAULT_LANGUAGE = 'french';

// Get enabled languages
export const getEnabledLanguages = () => {
    return Object.entries(SUPPORTED_LANGUAGES)
        .filter(([key, lang]) => lang.enabled)
        .reduce((acc, [key, lang]) => ({ ...acc, [key]: lang }), {});
};

// Get language by code
export const getLanguageByCode = (code) => {
    return Object.values(SUPPORTED_LANGUAGES).find(lang => lang.code === code);
};

// Difficulty levels (consistent across all languages)
export const DIFFICULTY_LEVELS = {
    beginner: {
        key: 'beginner',
        label: 'Beginner',
        color: '#10b981',
        description: 'For those just starting their language journey'
    },
    intermediate: {
        key: 'intermediate',
        label: 'Intermediate',
        color: '#f59e0b',
        description: 'For learners with basic understanding'
    },
    advanced: {
        key: 'advanced',
        label: 'Advanced',
        color: '#ef4444',
        description: 'For experienced learners seeking fluency'
    }
};

// Practice types
export const PRACTICE_TYPES = {
    speaking: {
        key: 'speaking',
        label: 'Speaking',
        icon: 'Mic',
        description: 'Practice pronunciation and oral expression'
    },
    writing: {
        key: 'writing',
        label: 'Writing',
        icon: 'PenTool',
        description: 'Practice written expression and grammar'
    },
    listening: {
        key: 'listening',
        label: 'Listening',
        icon: 'Headphones',
        description: 'Practice comprehension skills',
        enabled: false // Future feature
    },
    reading: {
        key: 'reading',
        label: 'Reading',
        icon: 'BookOpen',
        description: 'Practice reading comprehension',
        enabled: false // Future feature
    }
};

// Scoring configuration
export const SCORING_CONFIG = {
    maxScore: 10,
    passingScore: 6,
    excellentScore: 9,
    categories: ['grammar', 'vocabulary', 'fluency', 'accuracy', 'coherence']
};

// UI text that could be translated (placeholder for i18n)
export const UI_TEXT = {
    en: {
        // Navigation
        home: 'Home',
        lessons: 'Lessons',
        practice: 'Practice',
        progress: 'Progress',
        profile: 'Profile',

        // Actions
        start: 'Start',
        continue: 'Continue',
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save',

        // Feedback
        loading: 'Loading...',
        success: 'Success!',
        error: 'An error occurred',

        // Practice
        choosePracticeType: 'Choose your practice type',
        selectPrompt: 'Select a prompt',
        recordYourResponse: 'Record your response',
        writeYourResponse: 'Write your response',

        // Progress
        yourProgress: 'Your Progress',
        dayStreak: 'Day Streak',
        totalPractices: 'Total Practices',
        achievements: 'Achievements'
    }
};

// Get UI text (currently returns English, ready for i18n)
export const getUIText = (key, lang = 'en') => {
    return UI_TEXT[lang]?.[key] || UI_TEXT.en[key] || key;
};

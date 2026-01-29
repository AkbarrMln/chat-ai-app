import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

// Sokka AI Chatbot Style - Vibrant, Modern, Pill-shaped
const lightColors = {
    // Backgrounds
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',

    // Primary - Sokka Electric Blue
    primary: '#0062FF',
    primaryLight: '#4D91FF',
    primaryDark: '#004ECC',
    primaryBg: '#F0F6FF',

    // UI Accents
    accent: '#7C3AED', // Soft Violet
    secondary: '#1A1C1E', // Dark Slate for contrast
    secondaryBg: '#F8FAFC',

    // Text
    text: '#1A1C1E',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // UI Elements
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#F1F5F9',

    // Chat Specific (Sokka Style)
    messageUser: '#0062FF',
    messageUserText: '#FFFFFF',
    messageAI: '#F1F5F9',
    messageAIText: '#1A1C1E',
    messageAIBorder: '#F1F5F9',

    // Components
    cardBackground: '#FFFFFF',
    cardBorder: '#F1F5F9',
    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',
    avatarBackground: '#F1F5F9',
    tabBarBackground: '#FFFFFF',
    headerBackground: '#FFFFFF',

    // Status
    success: '#10B981',
    successBg: '#D1FAE5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',

    // Decorative
    shadowColor: 'rgba(0, 98, 255, 0.08)',
    online: '#10B981',
    unreadBadge: '#0062FF',
};

const darkColors = {
    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',

    // Primary - Sokka Electric Blue
    primary: '#0062FF',
    primaryLight: '#4D91FF',
    primaryDark: '#004ECC',
    primaryBg: '#1E293B',

    // UI Accents
    accent: '#A78BFA',
    secondary: '#F8FAFC',
    secondaryBg: '#334155',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textOnPrimary: '#FFFFFF',

    // UI Elements
    border: '#334155',
    borderLight: '#475569',
    divider: '#334155',

    // Chat Specific
    messageUser: '#0062FF',
    messageUserText: '#FFFFFF',
    messageAI: '#334155',
    messageAIText: '#F8FAFC',
    messageAIBorder: '#334155',

    // Components
    cardBackground: '#1E293B',
    cardBorder: '#334155',
    inputBackground: '#0F172A',
    inputBorder: '#334155',
    avatarBackground: '#334155',
    tabBarBackground: '#1E293B',
    headerBackground: '#1E293B',

    // Decorative
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    online: '#34D399',
    unreadBadge: '#0062FF',
};

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

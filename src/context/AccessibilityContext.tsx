
import React, { createContext, useContext, useState, useEffect } from 'react';

type AccessibilityContextType = {
    fontSize: number; // 0=Normal, 1=Large, 2=Extra Large
    isHighContrast: boolean;
    isSimpleMode: boolean; // "Senior Mode"
    setFontSize: (size: number) => void;
    toggleHighContrast: () => void;
    toggleSimpleMode: () => void;
    resetAccessibility: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load from localStorage or defaults
    const [fontSize, setFontSizeState] = useState(() => {
        const saved = localStorage.getItem('accessibility_fontSize');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [isHighContrast, setIsHighContrast] = useState(() => {
        return localStorage.getItem('accessibility_highContrast') === 'true';
    });

    const [isSimpleMode, setIsSimpleMode] = useState(() => {
        return localStorage.getItem('accessibility_simpleMode') === 'true';
    });

    // Persist and Apply Effects
    useEffect(() => {
        localStorage.setItem('accessibility_fontSize', fontSize.toString());
        localStorage.setItem('accessibility_highContrast', isHighContrast.toString());
        localStorage.setItem('accessibility_simpleMode', isSimpleMode.toString());

        // Apply classes/attributes to body/html for global CSS
        const root = document.documentElement;

        // Font Size
        root.setAttribute('data-font-size', fontSize.toString());

        // High Contrast
        if (isHighContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Simple Mode
        if (isSimpleMode) {
            root.setAttribute('data-mode', 'simple');
        } else {
            root.removeAttribute('data-mode');
        }

    }, [fontSize, isHighContrast, isSimpleMode]);

    const setFontSize = (size: number) => {
        if (size >= 0 && size <= 2) {
            setFontSizeState(size);
        }
    };

    const toggleHighContrast = () => setIsHighContrast(prev => !prev);
    const toggleSimpleMode = () => setIsSimpleMode(prev => !prev);

    const resetAccessibility = () => {
        setFontSizeState(0);
        setIsHighContrast(false);
        setIsSimpleMode(false);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                fontSize,
                isHighContrast,
                isSimpleMode,
                setFontSize,
                toggleHighContrast,
                toggleSimpleMode,
                resetAccessibility
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};

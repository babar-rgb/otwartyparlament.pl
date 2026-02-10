import React, { createContext, useContext, useState, ReactNode } from 'react';

type Term = 9 | 10;

interface TermContextType {
    term: Term;
    setTerm: (term: Term) => void;
}

const TermContext = createContext<TermContextType | undefined>(undefined);

export function TermProvider({ children }: { children: ReactNode }) {
    const [term, setTerm] = useState<Term>(10); // Default to current term

    return (
        <TermContext.Provider value={{ term, setTerm }}>
            {children}
        </TermContext.Provider>
    );
}

export function useTerm() {
    const context = useContext(TermContext);
    if (context === undefined) {
        throw new Error('useTerm must be used within a TermProvider');
    }
    return context;
}

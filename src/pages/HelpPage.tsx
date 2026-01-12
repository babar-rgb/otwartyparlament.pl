
import { useState } from 'react';
import {
    HelpCircle,
    Book,
    MessageCircle,
    Info,
    ChevronDown,
    ChevronUp,
    Search,
    Mail,
    MessagesSquare
} from 'lucide-react';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_ITEMS = [
    {
        question: "Skąd pochodzą dane?",
        answer: "Wszystkie dane prezentowane na stronie są pobierane bezpośrednio z oficjalnego Systemu Informacyjnego Sejmu (API Sejmu). Są to publicznie dostępne informacje rządowe, które my jedynie wizualizujemy w bardziej przystępny sposób."
    },
    {
        question: "Jak często aktualizowane są dane?",
        answer: "System automatycznie synchronizuje dane każdej nocy. Informacje o bieżących głosowaniach i posiedzeniach mogą pojawiać się z kilkugodzinnym opóźnieniem zależnym od szybkości publikacji oficjalnych protokołów przez Kancelarię Sejmu."
    },
    {
        question: "Jak liczona jest frekwencja?",
        answer: "Frekwencja obliczana jest na podstawie oficjalnych wyników głosowań dla X Kadencji Sejmu. Wzór to: (Liczba głosów oddanych / Całkowita liczba głosowań) * 100%. Za głosy oddane uznajemy: 'Za', 'Przeciw', 'Wstrzymał się' oraz 'Obecny'. Głosy 'Nieobecny' obniżają frekwencję. Nasz system automatycznie pobiera te dane każdej nocy i przelicza statystyki na nowo, eliminując błędy historyczne (głosowania z poprzednich kadencji nie są wliczane)."
    },
    {
        question: "Co oznaczają statusy 404 w logach głosowań?",
        answer: "Czasami najnowsze głosowania nie mają jeszcze opublikowanych szczegółowych wyników imiennych w API Sejmu. W takim przypadku zobaczysz komunikat 'Dane w trakcie przetwarzania'. Jest to normalne zachowanie wynikające z tzw. 'eventual consistency' systemów rządowych."
    },
    {
        question: "Czy projekt jest związany z rządem?",
        answer: "Nie. Otwarty Parlament to niezależny projekt społecznościowy (non-profit/open-source). Nie reprezentujemy żadnej partii politycznej ani instytucji państwowej."
    }
];

const GLOSSARY_TERMS = [
    {
        term: "Interpelacja",
        definition: "Pytanie skierowane przez posła do ministra. Minister ma obowiązek odpowiedzieć na nie w ciągu 21 dni. Interpelacje dotyczą spraw o zasadniczym znaczeniu dla państwa."
    },
    {
        term: "Zapytanie poselskie",
        definition: "Podobne do interpelacji, ale dotyczy spraw mniej wagi lub konkretnych, lokalnych problemów. Odpowiedź jest również obowiązkowa."
    },
    {
        term: "Klub Parlamentarny",
        definition: "Grupa co najmniej 15 posłów. Kluby mają większe uprawnienia niż koła (np. reprezentacja w Konwencie Seniorów)."
    },
    {
        term: "Koło Poselskie",
        definition: "Mniejsza grupa posłów (min. 3). Mają ograniczone prawa w porównaniu do klubów."
    },
    {
        term: "Kworum",
        definition: "Minimalna liczba posłów (połowa ustawowej liczby, czyli 230), która musi być obecna na sali, aby głosowania były ważne."
    },
    {
        term: "Druk Sejmowy",
        definition: "Oficjalny dokument (projekt ustawy, sprawozdanie, uchwała), któremu nadano numer i skierowano do prac legislacyjnych."
    },
    {
        term: "Wotum zaufania",
        definition: "Uchwała Sejmu wyrażająca poparcie dla polityki rządu. Wymaga większości głosów."
    }
];

export default function HelpPage() {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGlossary = GLOSSARY_TERMS.filter(item =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-page text-primary pb-20">
            <SEO
                title="Centrum Pomocy - Otwarty Parlament"
                description="Słownik pojęć sejmowych, najczęstsze pytania (FAQ) i przewodnik po serwisie Otwarty Parlament."
            />

            {/* Hero Section */}
            <div className="relative bg-surface border-b border-border-base overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-accent-blue/10 text-accent-blue rounded-2xl mb-6">
                        <HelpCircle size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        Centrum Pomocy
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Przewodnik po zawiłościach polskiego parlamentaryzmu.
                        Tłumaczymy trudne pojęcia i wyjaśniamy jak korzystać z danych.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">

                {/* Section 1: Glossary */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-3">
                            <Book className="w-8 h-8 text-emerald-500" />
                            <h2 className="text-3xl font-black">Słownik Pojęć</h2>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Szukaj definicji..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-accent-blue outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {filteredGlossary.length > 0 ? (
                            filteredGlossary.map((item, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={idx}
                                    className="bg-surface p-6 rounded-2xl border border-border-base hover:border-accent-blue/30 transition-colors"
                                >
                                    <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {item.term}
                                    </h3>
                                    <p className="text-secondary text-sm leading-relaxed">
                                        {item.definition}
                                    </p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-secondary italic">
                                Nie znaleziono pojęć pasujących do "{searchTerm}".
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 2: FAQ */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <MessageCircle className="w-8 h-8 text-amber-500" />
                        <h2 className="text-3xl font-black">Częste Pytania (FAQ)</h2>
                    </div>

                    <div className="space-y-4">
                        {FAQ_ITEMS.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-surface rounded-2xl border border-border-base overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-bold text-lg">{item.question}</span>
                                    {openFaqIndex === idx ? <ChevronUp className="text-secondary" /> : <ChevronDown className="text-secondary" />}
                                </button>
                                <AnimatePresence>
                                    {openFaqIndex === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-6 pb-6 text-secondary leading-relaxed border-t border-border-base/50 pt-4">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: Contact/Info */}
                <section className="bg-accent-blue/5 rounded-3xl p-8 md:p-12 border border-accent-blue/10 text-center">
                    <Info className="w-12 h-12 text-accent-blue mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-4">Nadal potrzebujesz pomocy?</h2>
                    <p className="text-secondary max-w-xl mx-auto mb-8">
                        Jeśli masz pytania dotyczące działania serwisu, znalazłeś błąd lub chcesz zgłosić sugestię – skontaktuj się z nami.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="/kontakt"
                            className="inline-flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Mail size={18} />
                            Napisz do nas
                        </a>
                        <a
                            href="https://github.com/babar-rgb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-surface border border-border-base hover:bg-card-hover text-primary px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <MessagesSquare size={18} />
                            Zgłoś błąd na GitHub
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}

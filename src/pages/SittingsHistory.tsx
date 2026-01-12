
import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/SEO';
import { useTerm } from '../context/TermContext';

interface SittingSummary {
    id: number;
    term: number;
    sitting_number: number;
    summary_md: string;
    updated_at: string;
}

const SittingsHistory: React.FC = () => {
    const { term } = useTerm();
    const [summaries, setSummaries] = useState<SittingSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummaries = async () => {
            setLoading(true);
            try {
                // Hardcoded API URL as per previous fix
                const API_URL = "http://localhost:8000";
                const response = await fetch(`${API_URL}/sittings/summaries?term=${term}`);
                if (response.ok) {
                    const data = await response.json();
                    setSummaries(data);
                }
            } catch (err) {
                console.error("Failed to fetch summaries", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummaries();
    }, [term]);

    return (
        <div className="min-h-screen bg-page text-primary pt-24 pb-12 px-4 md:px-8 font-sans transition-all duration-500">
            <SEO
                title="Historia Posiedzeń | OtwartyParlament.pl"
                description={`Pełna historia posiedzeń Sejmu ${term}. kadencji.`}
            />

            <div className="container mx-auto max-w-4xl">
                <div className="mb-8 pl-4 lg:pl-0">
                    <Link to="/" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4 text-xs font-bold uppercase tracking-widest group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Powrót do Dashboardu
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary mb-2">Historia Posiedzeń</h1>
                    <p className="text-lg md:text-xl text-secondary">Kluczowe decyzje Sejmu {term}. kadencji w telegraficznym skrócie.</p>
                </div>

                {term === 9 && (
                    <div className="mb-12 mx-4 md:mx-0 p-8 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h3 className="text-xl font-black text-amber-900 dark:text-amber-500 mb-3 uppercase tracking-widest">Podsumowanie Kadencji (2019–2023)</h3>
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            Była to kadencja pełna "czarnych łabędzi": pandemia COVID-19, wojna w Ukrainie, kryzys na granicy białoruskiej i rekordowa inflacja. Legislacyjnie charakteryzowała się trybem ekspresowym (częste nocne głosowania), rosnącą polaryzacją oraz ogromnymi transferami społecznymi i zbrojeniowymi.
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-surface border border-border-base rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12 relative border-l-2 border-border-base ml-4 md:ml-8 pl-8 md:pl-12 py-4">
                        {summaries.map((sitting) => (
                            <div key={sitting.id} className="relative group">
                                {/* Timeline Node */}
                                <div className="absolute -left-[41px] md:-left-[58px] top-8 w-5 h-5 bg-page border-4 border-amber-500 rounded-full group-hover:scale-125 transition-transform duration-300 z-10 box-content" />

                                <div className="bg-surface border border-border-base rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    {/* Background decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[2.5rem] pointer-events-none" />

                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 border-b border-border-base pb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <div className="uppercase tracking-widest text-[9px] opacity-60 font-black mb-1">Raport z Posiedzenia</div>
                                            <div className="text-2xl font-black text-primary leading-none">Nr {sitting.sitting_number}</div>
                                        </div>
                                    </div>

                                    <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-amber-500">
                                        <ReactMarkdown
                                            components={{
                                                ul: ({ node, ...props }) => <ul className="space-y-4 list-none pl-0 block mt-6" {...props} />,
                                                li: ({ node, ...props }) => (
                                                    <li className="relative pl-6 mb-3" {...props}>
                                                        <span className="absolute left-0 top-2.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        <span className="text-slate-700 dark:text-slate-300 block">{props.children}</span>
                                                    </li>
                                                ),
                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                p: ({ node, ...props }) => {
                                                    // This handles extracting the date line or intro.
                                                    const text = String(props.children);

                                                    // Typically the first distinct paragraph in our imported text is the date/intro line.
                                                    // Example: `1. posiedzenie (13 listopada – 21 grudnia 2023 r.)`
                                                    if (text.match(/^\d+\. posiedzenie/)) {
                                                        return <div className="text-xl font-bold text-primary mb-4 block leading-tight">{text.replace(/^\d+\. posiedzenie/, '').trim().replace(/^\(/, '').replace(/\)$/, '')}</div>;
                                                    }

                                                    // Intro text (short, not a bullet)
                                                    if (!text.startsWith('*') && text.length > 5) {
                                                        return <p className="text-lg text-secondary dark:text-slate-400 italic mb-6 leading-relaxed border-l-4 border-amber-500/20 pl-4 py-1" {...props} />
                                                    }

                                                    return <p className="text-base text-slate-600 dark:text-slate-400 mb-4" {...props} />
                                                }
                                            }}
                                        >
                                            {sitting.summary_md}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SittingsHistory;

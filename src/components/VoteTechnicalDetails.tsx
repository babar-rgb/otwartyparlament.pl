import { useState } from 'react';
import { ChevronUp, Info, FileText } from 'lucide-react';
import { extractPrintNumbers } from '../utils/titleFormatter';

interface VoteTechnicalDetailsProps {
    rawTitle: string;
}

export default function VoteTechnicalDetails({ rawTitle }: VoteTechnicalDetailsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const printNumbers = extractPrintNumbers(rawTitle);

    return (
        <div className="mt-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
                {isExpanded ? <ChevronUp size={14} /> : <Info size={14} />}
                {isExpanded ? 'Ukryj szczegóły prawne' : 'Pokaż pełny tytuł prawny i numery druków'}
            </button>

            {isExpanded && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Oryginalny tytuł w systemie Sejmowym
                        </span>
                        <p className="text-sm font-mono text-slate-600 break-words leading-relaxed">
                            {rawTitle}
                        </p>
                    </div>

                    {printNumbers.length > 0 && (
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Druki sejmowe
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {printNumbers.map((num, idx) => (
                                    <a
                                        key={idx}
                                        href={`https://www.sejm.gov.pl/sejm10.nsf/przebieg.xsp?nr=${num}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                        <FileText size={12} />
                                        Druk nr {num}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

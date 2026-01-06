import { Search, Sparkles, Filter as FilterIcon, X } from 'lucide-react';
import { useTerm } from '../../../context/TermContext';
import TermSwitcher from '../../ui/TermSwitcher';

interface CommitteeHeroProps {
    committeeCount: number;
}

export default function CommitteeHero({ committeeCount }: CommitteeHeroProps) {
    const { term } = useTerm();

    return (
        <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Sparkles size={12} />
                            Legislative Database v1.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                            Komisje <span className="italic font-serif opacity-60">Sejmowe</span>
                        </h1>
                        <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                            Przegląd prac {committeeCount} komisji sejmowych w {term}. kadencji. Monitoruj posiedzenia, składy i postępy legislacyjne.
                        </p>
                    </div>
                    <TermSwitcher />
                </div>
            </div>
        </div>
    );
}

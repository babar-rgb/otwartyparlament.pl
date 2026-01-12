
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

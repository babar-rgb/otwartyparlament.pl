import { useState } from 'react';
import { Target, ArrowRight, ShieldCheck, Info, Loader2, Sparkles } from 'lucide-react';
import { usePoliticalTwin } from '../hooks/usePoliticalTwin';

interface AlignmentPart {
    party: string;
    score: number;
    votes_for: number;
    total_votes: number;
}

interface MatchedVote {
    id: number;
    title: string;
    date: string;
    topic: string;
}

export default function AITwin() {
    const [query, setQuery] = useState('');
    const { mutate: match, isPending: loading, data: results } = usePoliticalTwin();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || query.length < 5) return;
        match(query);
    };

    return (
        <div className="min-h-screen bg-page pt-32 pb-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue/10 border border-accent-blue/20 rounded-full mb-6">
                        <Sparkles className="text-accent-blue" size={16} />
                        <span className="text-accent-blue font-bold text-xs uppercase tracking-widest">System Dopasowania</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 leading-tight">
                        Znajdź Swojego <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-purple-500">
                            Politycznego Bliźniaka
                        </span>
                    </h1>
                    <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                        Opisz swoje poglądy lub problem, który Cię nurtuje. AI sprawdzi tysiące rzeczywistych głosowań,
                        aby pokazać Ci, kto naprawdę reprezentuje Twoje interesy w Sejmie.
                    </p>
                </div>

                {/* Search Box */}
                <form onSubmit={handleSearch} className="relative mb-20 animate-slide-up">
                    <div className="bg-surface p-2 rounded-[2.5rem] border border-border-base shadow-2xl shadow-accent-blue/5">
                        <div className="flex items-center gap-4 px-6">
                            <Target className="text-secondary/40 shrink-0" size={24} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Np. 'Chciałbym niższych podatków dla małych firm i lepszej ochrony lasów...'"
                                className="w-full py-6 bg-transparent text-primary text-xl placeholder:text-secondary/30 focus:outline-none font-medium"
                            />
                            <button
                                type="submit"
                                disabled={loading || query.length < 5}
                                className="bg-accent-blue text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3 shadow-lg shadow-accent-blue/25"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                Wygeneruj Dopasowanie
                            </button>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 left-10 flex items-center gap-2 text-secondary/40 text-[10px] font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} />
                        Twoje dane są przetwarzane lokalnie i anonimowo
                    </div>
                </form>

                {results && !loading && (
                    <div className="space-y-12 animate-fade-in">
                        {/* Results Header */}
                        <div className="flex items-center gap-4 border-l-4 border-accent-blue pl-6">
                            <div>
                                <h2 className="text-2xl font-bold text-primary">Twoja Mapa Dopasowania</h2>
                                <p className="text-secondary text-sm">Na podstawie analizy semantycznej głosowań z X kadencji</p>
                            </div>
                        </div>

                        {/* Alignment List */}
                        <div className="grid gap-4">
                            {results.alignment.map((item: AlignmentPart, idx: number) => (
                                <div
                                    key={item.party}
                                    className="bg-surface border border-border-base rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-accent-blue/30 transition-all"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="w-full md:w-32 text-center md:text-left">
                                        <div className="text-xs font-black text-secondary/40 mb-1 uppercase">Partia/Klub</div>
                                        <div className="text-xl font-black text-primary truncate max-w-[120px]">{item.party}</div>
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Zgodność Poglądów</span>
                                            <span className="text-2xl font-black text-accent-blue">{item.score}%</span>
                                        </div>
                                        <div className="h-3 bg-page rounded-full overflow-hidden border border-border-base">
                                            <div
                                                className="h-full bg-gradient-to-r from-accent-blue to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-center md:text-right">
                                        <div className="text-xs font-bold text-secondary/40 mb-1 uppercase">Próba Danych</div>
                                        <div className="text-sm font-bold text-primary">
                                            {item.votes_for} / {item.total_votes} <span className="text-secondary/30 ml-1">za</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Logic Explanation */}
                        <div className="bg-accent-blue/5 border border-accent-blue/10 rounded-3xl p-8 flex gap-6">
                            <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Info className="text-accent-blue" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-primary">Jak to obliczyliśmy?</h3>
                                <p className="text-secondary text-sm leading-relaxed">
                                    AI odnalazła <strong>{results.matched_votes?.length || 0} najważniejsze głosowania</strong>,
                                    które semantycznie najlepiej pasują do Twojego zapytania. Następnie przeanalizowaliśmy
                                    rzeczywiste wyniki tych głosowań dla każdego klubu parlamentarnego. Wynik % pokazuje,
                                    jak często dany klub głosował "ZA" w sprawach, które Cię interesują.
                                </p>
                                <div className="grid gap-2">
                                    {results.matched_votes?.map((v: MatchedVote) => (
                                        <div key={v.id} className="text-[10px] font-bold text-secondary flex items-start gap-2">
                                            <span className="text-accent-blue shrink-0">•</span>
                                            <span className="line-clamp-1 opacity-70 italic">{v.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

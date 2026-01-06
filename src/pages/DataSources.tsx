import { Database, Server, Cpu, ShieldCheck, FileText, Globe, Sparkles } from 'lucide-react';

export default function DataSources() {
    return (
        <div className="min-h-screen bg-page dashboard-mesh pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-24 relative">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-accent-blue/20 mb-8 backdrop-blur-md">
                        <Database size={14} />
                        Transparentność Danych
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-primary mb-8 tracking-tighter leading-tight">
                        Jak to <span className="inline-block italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-indigo-400 to-cyan-400 pb-2">działa?</span>
                    </h1>
                    <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed font-medium border-x border-border-base px-12">
                        Nasza platforma łączy oficjalne dane sejmowe z nowoczesną analizą AI, aby dostarczyć Ci obiektywny obraz polskiej polityki w czasie rzeczywistym.
                    </p>
                </div>

                {/* Pipeline Visualization */}
                <div className="relative mb-32">
                    <div className="bg-surface border border-border-base rounded-[4rem] p-12 md:p-20 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/[0.03] to-transparent pointer-events-none"></div>
                        <div className="grid md:grid-cols-3 gap-16 items-center relative z-10">
                            {/* Step 1 */}
                            <div className="text-center group">
                                <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border-base shadow-lg group-hover:scale-110 group-hover:shadow-accent-blue/10 transition-all duration-500">
                                    <Server size={36} className="text-secondary group-hover:text-accent-blue transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">1. Sejm API</h3>
                                <p className="text-secondary text-sm leading-relaxed font-medium">
                                    Pobieramy surowe dane bezpośrednio z oficjalnych serwerów Systemu Informacyjnego Sejmu (api.sejm.gov.pl).
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center group">
                                <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border-base shadow-lg group-hover:scale-110 group-hover:shadow-indigo-500/10 transition-all duration-500">
                                    <Cpu size={36} className="text-secondary group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">2. Przetwarzanie & AI</h3>
                                <p className="text-secondary text-sm leading-relaxed font-medium">
                                    Nasze algorytmy czyszczą dane, a modele językowe (Ollama/LLM) generują bezstronne podsumowania.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center group">
                                <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border-base shadow-lg group-hover:scale-110 group-hover:shadow-emerald-500/10 transition-all duration-500">
                                    <Globe size={36} className="text-secondary group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">3. Interfejs Obywatelski</h3>
                                <p className="text-secondary text-sm leading-relaxed font-medium">
                                    Prezentujemy dane w czytelnej formie, umożliwiając łatwe wyszukiwanie i weryfikację pracy posłów.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Grid */}
                <div className="grid md:grid-cols-2 gap-12 mb-24">
                    <div className="bg-surface p-12 rounded-[3rem] border border-border-base shadow-xl group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-primary/[0.03] group-hover:text-indigo-500/[0.05] transition-colors"><FileText size={160} /></div>
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/5 group-hover:scale-110 transition-transform">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-primary mb-6 tracking-tight">Analiza AI (NLP)</h3>
                        <p className="text-secondary leading-relaxed font-medium mb-8">
                            Każde głosowanie jest analizowane przez wyspecjalizowane agensy językowe. System generuje ekstrakty kluczowych informacji:
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Krótkie podsumowanie 'językiem korzyści'",
                                "Zestawienie argumentów 'Za' oraz 'Przeciw'",
                                "Analizę potencjalnego wpływu na gospodarkę"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-primary font-bold">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-surface p-12 rounded-[3rem] border border-border-base shadow-xl group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-primary/[0.03] group-hover:text-emerald-500/[0.05] transition-colors"><ShieldCheck size={160} /></div>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-primary mb-6 tracking-tight">System Weryfikacji</h3>
                        <p className="text-secondary leading-relaxed font-medium mb-8">
                            Algorytmy porównują głosy każdego posła z większością jego klubu parlamentarnego, identyfikując tzw. "indywidualizm":
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Głosowanie przeciwne do linii partii",
                                "Wstrzymanie się od głosu wbrew dyscyplinie",
                                "Absencje statystycznie istotne (poza marginesem)"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-primary font-bold">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-surface border border-border-base rounded-[3rem] p-12 shadow-2xl relative overflow-hidden mb-24">
                    <div className="flex items-center gap-4 mb-8 border-b border-border-base pb-6">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                            <ShieldCheck size={28} />
                        </div>
                        <h4 className="text-2xl font-black text-primary tracking-tight">
                            Nota Prawna & Compliance
                        </h4>
                    </div>
                    <div className="space-y-6 text-sm text-secondary leading-relaxed font-medium">
                        <p>
                            Serwis OtwartyParlament.pl procesuje dane w oparciu o <span className="text-primary font-bold">ustawę o otwartych danych</span> i ponownym wykorzystywaniu informacji sektora publicznego (Dz.U. 2023 poz. 1524).
                        </p>

                        <div className="grid md:grid-cols-2 gap-10 mt-8">
                            <div className="bg-page p-8 rounded-[2rem] border border-border-base">
                                <h5 className="text-lg font-black text-primary mb-4 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-blue" />
                                    Integracja Danych
                                </h5>
                                <p className="text-xs">
                                    Prezentowane rekordy pochodzą bezpośrednio z API Sejmu. Baza jest synchronizowana cyklicznie, zapewniając integralność z oficjalnym monitorem sejmowym.
                                </p>
                            </div>

                            <div className="bg-page p-8 rounded-[2rem] border border-border-base">
                                <h5 className="text-lg font-black text-primary mb-4 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    Charakter Analiz
                                </h5>
                                <p className="text-xs">
                                    Podsumowania i oceny ważności aktów prawnych są wynikiem heurystyki AI. Nie stanowią one oficjalnej wykładni prawnej ani stanowiska Kancelarii Sejmu.
                                </p>
                            </div>
                        </div>

                        <p className="text-[10px] text-secondary/50 mt-8 italic border-t border-border-base pt-6 uppercase tracking-widest font-bold">
                            Kancelaria Sejmu nie ponosi odpowiedzialności za treść interpretacji serwisu. System jest autonomiczną inicjatywą technologiczną.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

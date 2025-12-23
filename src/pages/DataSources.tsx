import { Database, Server, Cpu, ShieldCheck, FileText, Globe } from 'lucide-react';

export default function DataSources() {
    return (
        <div className="min-h-screen bg-[#060613] pt-24 pb-12 px-4 animate-fade-in">
            <div className="container mx-auto max-w-5xl">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full font-bold text-sm mb-6 border border-indigo-500/20">
                        <Database size={16} />
                        <span>Transparentność Danych</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                        Jak to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">działa?</span>
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        Nasza platforma łączy oficjalne dane sejmowe z nowoczesną analizą AI, aby dostarczyć Ci obiektywny obraz polskiej polityki.
                    </p>
                </div>

                {/* Pipeline Visualization */}
                <div className="relative mb-24">
                    <div className="relative bg-[#111126] border border-white/5 rounded-[2.5rem] p-8 md:p-12 overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full transform -translate-y-1/2"></div>
                        <div className="grid md:grid-cols-3 gap-8 items-center relative z-10">
                            {/* Step 1 */}
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                    <Server size={32} className="text-white/60" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">1. Sejm API</h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    Pobieramy surowe dane bezpośrednio z oficjalnych serwerów Systemu Informacyjnego Sejmu (API).
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                    <Cpu size={32} className="text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">2. Przetwarzanie & AI</h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    Nasze algorytmy czyszczą dane, a modele językowe (LLM) generują bezstronne podsumowania ustaw.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <Globe size={32} className="text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">3. Otwarty Parlament</h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    Prezentujemy dane w czytelnej formie, umożliwiając łatwe wyszukiwanie i weryfikację posłów.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-[#111126] p-8 rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Analiza Ustaw (AI)</h3>
                        <p className="text-white/60 leading-relaxed">
                            Każde głosowanie jest analizowane przez zaawansowane modele językowe. AI generuje:
                        </p>
                        <ul className="mt-4 space-y-2 text-white/70">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                Proste wyjaśnienie "o co chodzi"
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                Listę potencjalnych korzyści (Za)
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                Listę ryzyk i wad (Przeciw)
                            </li>
                        </ul>
                    </div>

                    <div className="bg-[#111126] p-8 rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Wyrwali się</h3>
                        <p className="text-white/60 leading-relaxed">
                            Jak definiujemy "wyrwanie się"? Porównujemy głos każdego posła z większością jego klubu.
                        </p>
                        <ul className="mt-4 space-y-2 text-white/70">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                Głos inny niż większość klubu = Wyrwanie
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                Wstrzymanie się, gdy klub jest za/przeciw = Wyrwanie
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                Nieobecności nie są wliczane
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-[#111126] border border-white/5 rounded-[2rem] p-8">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-500" />
                        Nota Prawna i Zgodność z Ustawą
                    </h4>
                    <div className="space-y-4 text-sm text-white/50">
                        <p>
                            Serwis OtwartyParlament.pl działa w oparciu o ustawę o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego (Dz.U. 2023 poz. 1524).
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                            <div className="bg-[#060613] p-4 rounded-xl border border-white/5">
                                <h5 className="font-bold text-white mb-2">1. Źródło i Czas Danych</h5>
                                <p>
                                    Prezentowane dane pochodzą z Systemu Informacyjnego Sejmu (api.sejm.gov.pl).
                                    Baza danych jest aktualizowana codziennie w godzinach porannych.
                                    <br />
                                    <span className="text-xs text-white/30 mt-2 block">
                                        Dane aktualne na dzień: {new Date().toLocaleDateString('pl-PL')}
                                    </span>
                                </p>
                            </div>

                            <div className="bg-[#060613] p-4 rounded-xl border border-white/5">
                                <h5 className="font-bold text-white mb-2">2. Przetwarzanie i AI</h5>
                                <p>
                                    Tematyka głosowań oraz ocena ich ważności są wynikiem automatycznej analizy (AI) dokonanej przez algorytmy serwisu i nie stanowią oficjalnej informacji pochodzącej z Kancelarii Sejmu.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-white/30 mt-4 italic">
                            Kancelaria Sejmu nie ponosi odpowiedzialności za treść analiz ani za sposób dalszego wykorzystania danych przetworzonych przez serwis.
                            Serwis jest inicjatywą społeczną non-profit.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

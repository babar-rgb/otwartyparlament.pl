import { Database, Server, Cpu, ShieldCheck, FileText, Globe } from 'lucide-react';

export default function DataSources() {
    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm mb-6 border border-blue-100">
                    <Database size={16} />
                    <span>Transparentność Danych</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                    Jak to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">działa?</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Nasza platforma łączy oficjalne dane sejmowe z nowoczesną analizą AI, aby dostarczyć Ci obiektywny obraz polskiej polityki.
                </p>
            </div>

            {/* Pipeline Visualization */}
            <div className="relative mb-24">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl transform -rotate-1"></div>
                <div className="relative bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-xl">
                    <div className="grid md:grid-cols-3 gap-8 items-center relative">
                        {/* Step 1 */}
                        <div className="text-center relative z-10">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-slate-200">
                                <Server size={40} className="text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">1. Sejm API</h3>
                            <p className="text-slate-600 text-sm">
                                Pobieramy surowe dane bezpośrednio z oficjalnych serwerów Systemu Informacyjnego Sejmu (API).
                            </p>
                        </div>

                        {/* Connector 1-2 (Desktop) */}
                        <div className="hidden md:block absolute top-10 left-1/3 w-1/3 h-0.5 bg-slate-200 -z-0"></div>

                        {/* Step 2 */}
                        <div className="text-center relative z-10">
                            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-blue-100">
                                <Cpu size={40} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">2. Przetwarzanie & AI</h3>
                            <p className="text-slate-600 text-sm">
                                Nasze algorytmy czyszczą dane, a modele językowe (LLM) generują bezstronne podsumowania ustaw.
                            </p>
                        </div>

                        {/* Connector 2-3 (Desktop) */}
                        <div className="hidden md:block absolute top-10 right-1/3 w-1/3 h-0.5 bg-slate-200 -z-0"></div>

                        {/* Step 3 */}
                        <div className="text-center relative z-10">
                            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-green-100">
                                <Globe size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">3. Otwarty Parlament</h3>
                            <p className="text-slate-600 text-sm">
                                Prezentujemy dane w czytelnej formie, umożliwiając łatwe wyszukiwanie i weryfikację posłów.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors group">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Analiza Ustaw (AI)</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Każde głosowanie jest analizowane przez zaawansowane modele językowe. AI generuje:
                    </p>
                    <ul className="mt-4 space-y-2 text-slate-700">
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

                <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-orange-300 transition-colors group">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Wskaźniki Buntu</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Jak obliczamy "buntownika"? Porównujemy głos każdego posła z większością jego klubu.
                    </p>
                    <ul className="mt-4 space-y-2 text-slate-700">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Głos inny niż większość klubu = Bunt
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Wstrzymanie się, gdy klub jest za/przeciw = Bunt
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Nieobecności nie są wliczane do buntu
                        </li>
                    </ul>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-600" />
                    Nota Prawna i Zgodność z Ustawą
                </h4>
                <div className="space-y-4 text-sm text-slate-600">
                    <p>
                        Serwis OtwartyParlament.pl działa w oparciu o ustawę o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego (Dz.U. 2023 poz. 1524).
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-slate-900 mb-2">1. Źródło i Czas Danych</h5>
                            <p>
                                Prezentowane dane pochodzą z Systemu Informacyjnego Sejmu (api.sejm.gov.pl).
                                Baza danych jest aktualizowana codziennie w godzinach porannych.
                                <br />
                                <span className="text-xs text-slate-400 mt-2 block">
                                    Dane aktualne na dzień: {new Date().toLocaleDateString('pl-PL')}
                                </span>
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-slate-900 mb-2">2. Przetwarzanie i AI</h5>
                            <p>
                                Tematyka głosowań oraz ocena ich ważności są wynikiem automatycznej analizy (AI) dokonanej przez algorytmy serwisu i nie stanowią oficjalnej informacji pochodzącej z Kancelarii Sejmu.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 italic">
                        Kancelaria Sejmu nie ponosi odpowiedzialności za treść analiz ani za sposób dalszego wykorzystania danych przetworzonych przez serwis.
                        Serwis jest inicjatywą społeczną non-profit.
                    </p>
                </div>
            </div>
        </div>
    );
}

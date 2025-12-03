import { Mail, Bell, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        // Mock API call
        setStatus('success');
        setEmail('');
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full font-bold text-sm mb-6 border border-orange-100">
                    <Bell size={16} />
                    <span>Bądź na bieżąco</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                    Polityka w <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">pigułce</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Dołącz do 15,000+ obywateli, którzy otrzymują cotygodniowe podsumowania najważniejszych głosowań i wydarzeń z Sejmu. Bez spamu, tylko fakty.
                </p>
            </div>

            {/* Subscription Card */}
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-12 mb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                {status === 'success' ? (
                    <div className="text-center py-12 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <ShieldCheck size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Dziękujemy za zapis!</h3>
                        <p className="text-slate-600">Sprawdź swoją skrzynkę, aby potwierdzić subskrypcję.</p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-6 text-orange-600 font-bold hover:underline"
                        >
                            Wróć do formularza
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Twój adres email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jan.kowalski@przyklad.pl"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all hover:scale-105 shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-lg"
                                >
                                    Zapisz się
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center md:text-left">
                            Szanujemy Twoją prywatność. Zero spamu. Wypisz się w każdej chwili.
                        </p>
                    </form>
                )}
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-orange-300 transition-colors group">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Szybkie Podsumowania</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Zamiast czytać setki stron ustaw, otrzymasz zwięzłe podsumowania wygenerowane przez AI, wyjaśniające istotę zmian.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors group">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                        <Bell size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Alerty o Głosowaniach</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Bądź pierwszym, który dowie się o kontrowersyjnych głosowaniach i wynikach Twoich reprezentantów.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-green-300 transition-colors group">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Niezależne Analizy</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Nasze treści są wolne od partyjnego przekazu. Opieramy się wyłącznie na danych i faktach legislacyjnych.
                    </p>
                </div>
            </div>
        </div>
    );
}

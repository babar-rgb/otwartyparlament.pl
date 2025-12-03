import { Mail, MessageSquare, HelpCircle, Send, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
    const [formState, setFormState] = useState({ name: '', email: '', message: '' });
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock send
        setIsSent(true);
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold text-sm mb-6 border border-purple-100">
                    <MessageSquare size={16} />
                    <span>Kontakt & Wsparcie</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                    Jesteśmy tu dla <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Ciebie</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Masz pytania, sugestie lub znalazłeś błąd? Chcemy budować tę platformę razem z Tobą.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-20">
                {/* Contact Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <Mail className="text-purple-600" />
                        Napisz do nas
                    </h2>

                    {isSent ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <Send size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Wiadomość wysłana!</h3>
                            <p className="text-slate-600">Postaramy się odpowiedzieć w ciągu 24h.</p>
                            <button
                                onClick={() => { setIsSent(false); setFormState({ name: '', email: '', message: '' }); }}
                                className="mt-6 text-purple-600 font-bold hover:underline"
                            >
                                Wyślij kolejną wiadomość
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Imię</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    placeholder="Twoje imię"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formState.email}
                                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    placeholder="twoj@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">Wiadomość</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    value={formState.message}
                                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                    placeholder="O czym chcesz porozmawiać?"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all hover:scale-[1.02] shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                            >
                                Wyślij wiadomość
                                <Send size={18} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Info & FAQ */}
                <div className="space-y-8">
                    {/* Socials Card */}
                    <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xl font-bold mb-6">Znajdź nas w sieci</h3>
                        <div className="flex gap-4">
                            <a href="#" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Twitter size={24} />
                            </a>
                            <a href="#" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Facebook size={24} />
                            </a>
                            <a href="#" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Linkedin size={24} />
                            </a>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-slate-400 text-sm mb-1">Email bezpośredni:</p>
                            <a href="mailto:kontakt@otwartyparlament.pl" className="text-lg font-bold hover:text-purple-300 transition-colors">
                                kontakt@otwartyparlament.pl
                            </a>
                        </div>
                    </div>

                    {/* FAQ Accordion (Static for now) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <HelpCircle className="text-blue-600" />
                            Częste Pytania (FAQ)
                        </h3>
                        <div className="space-y-4">
                            <details className="group">
                                <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-slate-800 hover:text-purple-600 transition-colors">
                                    <span>Czy to jest oficjalna strona Sejmu?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="text-slate-600 mt-3 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                                    Nie. OtwartyParlament.pl to niezależna inicjatywa obywatelska. Korzystamy z oficjalnych danych, ale nie jesteśmy powiązani z Kancelarią Sejmu.
                                </p>
                            </details>
                            <div className="h-px bg-slate-100"></div>
                            <details className="group">
                                <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-slate-800 hover:text-purple-600 transition-colors">
                                    <span>Skąd pochodzą dane?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="text-slate-600 mt-3 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                                    Wszystkie dane pobieramy automatycznie z Systemu Informacyjnego Sejmu (API) oraz oficjalnych stron sejmowych. Są to dane publiczne.
                                </p>
                            </details>
                            <div className="h-px bg-slate-100"></div>
                            <details className="group">
                                <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-slate-800 hover:text-purple-600 transition-colors">
                                    <span>Czy mogę pomóc w rozwoju?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="text-slate-600 mt-3 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                                    Tak! Projekt jest Open Source. Zapraszamy do zakładki "Kod Źródłowy" lub do kontaktu bezpośredniego.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

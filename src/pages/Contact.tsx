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
        <div className="min-h-screen bg-page px-4 pt-24 pb-12 transition-all duration-500">
            <div className="max-w-5xl mx-auto space-y-16 animate-fade-in">
                {/* Hero Section */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6 border border-purple-500/20">
                        <MessageSquare size={14} />
                        <span>Kontakt & Wsparcie</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-primary mb-6 tracking-tight leading-tight">
                        Jesteśmy tu dla <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 italic font-serif">Ciebie</span>
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed font-medium opacity-80">
                        Masz pytania, sugestie lub znalazłeś błąd? Chcemy budować tę platformę razem z Tobą.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="bg-surface rounded-3xl border border-border-base p-8 shadow-xl relative overflow-hidden">
                        <h2 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                            <Mail className="text-purple-600 dark:text-purple-400" />
                            Napisz do nas
                        </h2>

                        {isSent ? (
                            <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-border-base">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                    <Send size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-primary mb-2">Wiadomość wysłana!</h3>
                                <p className="text-secondary font-medium uppercase tracking-widest text-xs">Postaramy się odpowiedzieć w ciągu 24h.</p>
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
                                    <label htmlFor="name" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-2">Imię</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formState.name}
                                        onChange={e => setFormState({ ...formState, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-primary font-medium"
                                        placeholder="Twoje imię"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-2">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formState.email}
                                        onChange={e => setFormState({ ...formState, email: e.target.value })}
                                        className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-primary font-medium"
                                        placeholder="twoj@email.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-2">Wiadomość</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        value={formState.message}
                                        onChange={e => setFormState({ ...formState, message: e.target.value })}
                                        className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none text-primary font-medium"
                                        placeholder="O czym chcesz porozmawiać?"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-purple-700 transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
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
                        <div className="bg-surface border border-border-base rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity"></div>
                            <h3 className="text-xl font-black text-primary mb-8 flex items-center gap-3">
                                <MessageSquare size={20} className="text-purple-500" />
                                Znajdź nas w sieci
                            </h3>
                            <div className="flex gap-4">
                                <a href="#" className="w-14 h-14 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 transition-all text-secondary hover:text-primary">
                                    <Twitter size={24} />
                                </a>
                                <a href="#" className="w-14 h-14 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 transition-all text-secondary hover:text-primary">
                                    <Facebook size={24} />
                                </a>
                                <a href="#" className="w-14 h-14 bg-black/5 dark:bg-white/5 border border-border-base rounded-2xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 transition-all text-secondary hover:text-primary">
                                    <Linkedin size={24} />
                                </a>
                            </div>
                            <div className="mt-8 pt-8 border-t border-border-base">
                                <p className="text-secondary text-xs uppercase tracking-widest font-black mb-2 opacity-60">Email bezpośredni</p>
                                <a href="mailto:kontakt@otwartyparlament.pl" className="text-lg md:text-xl font-bold text-primary hover:text-purple-500 transition-colors">
                                    kontakt@otwartyparlament.pl
                                </a>
                            </div>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="bg-surface rounded-3xl border border-border-base p-8 shadow-sm">
                            <h3 className="text-xl font-black text-primary mb-8 flex items-center gap-3">
                                <HelpCircle className="text-accent-blue" />
                                Częste Pytania (FAQ)
                            </h3>
                            <div className="space-y-6">
                                <details className="group">
                                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-primary hover:text-accent-blue transition-colors">
                                        <span>Czy to jest oficjalna strona Sejmu?</span>
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <p className="text-secondary mt-4 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 pl-4 border-l-2 border-border-base">
                                        Nie. OtwartyParlament.pl to niezależna inicjatywa obywatelska. Korzystamy z oficjalnych danych, ale nie jesteśmy powiązani z Kancelarią Sejmu.
                                    </p>
                                </details>
                                <div className="h-px bg-border-base"></div>
                                <details className="group">
                                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-primary hover:text-accent-blue transition-colors">
                                        <span>Skąd pochodzą dane?</span>
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <p className="text-secondary mt-4 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 pl-4 border-l-2 border-border-base">
                                        Wszystkie dane pobieramy automatycznie z Systemu Informacyjnego Sejmu (API) oraz oficjalnych stron sejmowych. Są to dane publiczne.
                                    </p>
                                </details>
                                <div className="h-px bg-border-base"></div>
                                <details className="group">
                                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-primary hover:text-accent-blue transition-colors">
                                        <span>Czy mogę pomóc w rozwoju?</span>
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <p className="text-secondary mt-4 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 pl-4 border-l-2 border-border-base">
                                        Tak! Projekt jest Open Source. Zapraszamy do zakładki "Kod Źródłowy" lub do kontaktu bezpośredniego.
                                    </p>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Github, Code2, Layers, Zap, GitBranch, ArrowRight, Database } from 'lucide-react';

export default function OpenSource() {
    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full font-bold text-sm mb-6 border border-slate-200">
                        <Github size={16} />
                        <span>Kod Źródłowy</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                        Kod dla <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">Demokracji</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                        Wierzymy, że narzędzia kontroli obywatelskiej powinny być transparentne tak samo, jak władza, którą kontrolują. Dlatego nasz kod jest otwarty.
                    </p>
                    <a
                        href="https://github.com/yourusername/otwartyparlament"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-lg shadow-slate-200"
                    >
                        <Github size={20} />
                        Zobacz na GitHub
                        <ArrowRight size={20} />
                    </a>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="relative bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <pre className="font-mono text-sm text-slate-300 overflow-x-auto">
                            <code>
                                <span className="text-purple-400">const</span> <span className="text-blue-400">democracy</span> = <span className="text-yellow-300">await</span> <span className="text-green-400">transparency</span>.init();{'\n'}
                                {'\n'}
                                <span className="text-purple-400">if</span> (!<span className="text-blue-400">democracy</span>.isOpen) {'{'}{'\n'}
                                {'  '}<span className="text-blue-400">democracy</span>.openSource();{'\n'}
                                {'}'}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>

            {/* Tech Stack Grid */}
            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Technologie</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Code2 size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">React + Vite</h3>
                    <p className="text-xs text-slate-500">Warstwa Wizualna</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-cyan-600">
                        <Layers size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Tailwind CSS</h3>
                    <p className="text-xs text-slate-500">Silnik Stylów</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-green-600">
                        <Database size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Supabase</h3>
                    <p className="text-xs text-slate-500">Baza Danych & Backend</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-yellow-600">
                        <Zap size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Python ETL</h3>
                    <p className="text-xs text-slate-500">Przetwarzanie Danych</p>
                </div>
            </div>

            {/* Contribution Call */}
            <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                    <GitBranch size={48} className="text-white mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Dołącz do projektu</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto mb-8 text-lg">
                        Szukamy programistów, designerów i analityków danych. Każdy Pull Request przybliża nas do bardziej świadomego społeczeństwa.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href="https://github.com/yourusername/otwartyparlament/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors"
                        >
                            Przeglądaj Issues
                        </a>
                        <a
                            href="mailto:kontakt@otwartyparlament.pl"
                            className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors"
                        >
                            Napisz do nas
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

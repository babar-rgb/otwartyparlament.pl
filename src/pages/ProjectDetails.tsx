import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText, Download,
    CheckCircle2, Circle, Clock, AlertTriangle,
    Share2, Bookmark, Zap
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLegislativeProcessDetails } from '../hooks/useLegislativeProcessDetails';


const LegislativeTimeline = ({ status }: { status: string }) => {
    // Simplified mapping of status to progress steps
    const steps = [
        { id: 'submitted', label: 'Wpłynął', keywords: ['wpłynął', 'wniesiony'] },
        { id: '1st_reading', label: 'I Czytanie', keywords: ['pierwsze czytanie', 'skierowany do'] },
        { id: 'committee', label: 'Prace Komisji', keywords: ['komisjach', 'prace', 'sprawozdanie'] },
        { id: 'voting', label: 'Głosowanie', keywords: ['uchwalono', 'odrzucono', 'przyjęto'] },
        { id: 'president', label: 'Prezydent', keywords: ['podpis', 'publikacja'] },
    ];

    // Determine current index based on status string matching
    const getCurrentStepIndex = () => {
        const s = status.toLowerCase();
        // Reverse check to find the furthest matching step
        for (let i = steps.length - 1; i >= 0; i--) {
            if (steps[i].keywords.some(k => s.includes(k))) return i;
        }
        return 0; // Default to first step
    };

    const currentIndex = getCurrentStepIndex();

    return (
        <div className="w-full py-8">
            <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border-base -z-10" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-blue transition-all duration-1000 -z-10"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                    const isCompleted = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-3 bg-page px-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                ${isCompleted
                                        ? 'bg-accent-blue border-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                        : 'bg-surface border-secondary/30 text-secondary/30'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={12} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isCurrent ? 'text-accent-blue' : 'text-secondary/60'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const { data: project, isLoading: loading, isError } = useLegislativeProcessDetails(id);

    if (loading) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue">
                        <Zap size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/50">Ładowanie analizy...</span>
                </div>
            </div>
        );
    }

    if (isError || !project) {
        return (
            <div className="min-h-screen bg-page pt-32 px-4 flex flex-col items-center justify-center">
                <AlertTriangle size={48} className="text-amber-500 mb-6" />
                <h1 className="text-3xl font-black text-primary mb-2">Projekt niedostępny</h1>
                <p className="text-secondary mb-8">Nie udało się odnaleźć szukanego dokumentu w bazie.</p>
                <Link to="/projekty" className="px-8 py-3 bg-surface hover:bg-white/5 border border-border-base rounded-xl font-bold transition-all">
                    Wróć do listy
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page text-primary font-sans selection:bg-accent-blue/30 pb-20">
            <SEO
                title={`Druk ${project.number} - ${project.title.substring(0, 50)}...`}
                description={project.ai_analysis?.summary || project.title}
            />

            {/* Back Navigation - inline, not fixed */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-28 animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to="/projekty"
                        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-surface group-hover:bg-accent-blue/10 transition-colors border border-border-base">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="font-bold text-sm">Wróć do projektów</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl bg-surface hover:bg-accent-blue/10 text-secondary hover:text-accent-blue transition-all border border-border-base group relative">
                            <Share2 size={18} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Udostępnij</span>
                        </button>
                        <button className="p-2.5 rounded-xl bg-surface hover:bg-accent-blue/10 text-secondary hover:text-accent-blue transition-all border border-border-base group relative">
                            <Bookmark size={18} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Zapisz</span>
                        </button>
                        <a
                            href={project.url}
                            target="_blank"
                            rel="noopener"
                            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-page rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            <Download size={16} />
                            PDF
                        </a>
                    </div>
                </div>

                <div className="animate-fade-in-up">

                    {/* Project Badge Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                        <span className="px-4 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            Druk nr {project.number}
                        </span>
                        <span className="px-4 py-1.5 rounded-full bg-surface text-secondary border border-border-base text-[11px] font-bold uppercase tracking-widest">
                            {project.type}
                        </span>
                        <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface text-secondary border border-border-base text-[11px] font-bold uppercase tracking-widest ml-auto">
                            <Calendar size={12} />
                            {project.date}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-12 leading-[1.1] tracking-tight bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                        {project.title}
                    </h1>

                    {/* Timeline */}
                    <div className="mb-16 p-8 rounded-[2rem] bg-surface/50 border border-border-base backdrop-blur-sm">
                        <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-6 flex items-center gap-2 opacity-70">
                            <Clock size={14} /> Status Legislacyjny
                        </h3>
                        <LegislativeTimeline status={project.status} />
                    </div>

                    {/* AI Analysis Grid */}
                    {project.ai_analysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
                            {/* Main Summary Card */}
                            <div className="md:col-span-12 lg:col-span-8 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-surface to-page border border-border-base shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12 scale-150 pointer-events-none">
                                    <Zap size={200} />
                                </div>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-blue flex items-center justify-center text-white shadow-lg shadow-accent-blue/30 transform group-hover:scale-110 transition-transform duration-500">
                                        <Zap size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Analiza AI</h2>

                                    </div>
                                </div>

                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <p className="text-lg leading-relaxed font-medium text-primary/90">
                                        {project.ai_analysis.summary}
                                    </p>
                                </div>

                                {project.ai_analysis.impact && (
                                    <div className="mt-8 pt-8 border-t border-border-base">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-secondary mb-3 opacity-60">Przewidywany Wpływ</div>
                                        <blockquote className="text-lg italic text-secondary/80 border-l-4 border-accent-blue pl-4 my-0">
                                            "{project.ai_analysis.impact}"
                                        </blockquote>
                                    </div>
                                )}
                            </div>

                            {/* Stats / Importance Column */}
                            <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                                <div className="flex-1 p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-center items-center text-center relative overflow-hidden hover:bg-indigo-500/10 transition-colors cursor-default">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Waga Ustawy</div>
                                    <div className="text-7xl font-black text-indigo-500 mb-2 tracking-tighter">
                                        {project.ai_analysis.importance}<span className="text-3xl text-indigo-500/40">/10</span>
                                    </div>
                                    <div className="w-full h-2 bg-indigo-500/10 rounded-full overflow-hidden max-w-[120px]">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${project.ai_analysis.importance * 10}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 p-8 rounded-[2.5rem] bg-surface border border-border-base flex flex-col justify-center">
                                    <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 opacity-70">Tagi & Kategorie</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['Legislacja', 'Sejm RP', project.type].map((tag: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-page border border-border-base rounded-lg text-xs font-bold text-secondary hover:text-primary hover:border-accent-blue/30 transition-colors cursor-default">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pros & Cons */}
                            <div className="md:col-span-6 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/20 transition-all group">
                                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Główne Zalety
                                </h3>
                                <ul className="space-y-4">
                                    {project.ai_analysis.pros.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm font-medium text-primary/80 transform group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${i * 100}ms` }}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="md:col-span-6 p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all group">
                                <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Ryzyka i Wady
                                </h3>
                                <ul className="space-y-4">
                                    {project.ai_analysis.cons.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm font-medium text-primary/80 transform group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${i * 100}ms` }}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 mb-16 rounded-[2rem] bg-surface border-2 border-dashed border-border-base flex items-center gap-6 opacity-60">
                            <div className="w-12 h-12 rounded-full bg-surface border border-border-base flex items-center justify-center">
                                <Clock className="text-secondary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Analiza w toku</h3>
                                <p className="text-sm text-secondary">Nasi agenci AI przetwarzają ten dokument.</p>
                            </div>
                        </div>
                    )}

                    {/* Content Viewer */}
                    <div className="mb-24">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <div className="p-2 bg-primary text-page rounded-lg">
                                    <FileText size={20} />
                                </div>
                                Pełna treść
                            </h2>
                            {project.content && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-50 border border-border-base px-3 py-1 rounded-full">
                                    {project.content.length.toLocaleString()} znaków
                                </span>
                            )}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem] transform translate-y-2 blur-2xl opacity-50 -z-10" />
                            <div className="bg-page rounded-[2.5rem] border border-border-base shadow-2xl overflow-hidden min-h-[600px] relative">
                                {/* Document Header Bar */}
                                <div className="h-12 bg-surface/50 border-b border-border-base flex items-center px-6 gap-2 backdrop-blur-md sticky top-0 z-10">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                                    <div className="ml-4 h-6 w-64 bg-border-base/40 rounded-full max-w-[50%]" />
                                </div>

                                <div className="p-8 md:p-16 max-w-4xl mx-auto">
                                    {project.content ? (
                                        <div className="font-serif text-lg md:text-xl leading-loose text-primary/90 whitespace-pre-wrap selection:bg-yellow-200/30 dark:selection:bg-yellow-500/30">
                                            {project.content}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                                                <FileText size={40} className="text-amber-500/60" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Dokument niedostępny cyfrowo</h3>
                                            <p className="text-secondary max-w-md mb-2">
                                                Ten dokument jest prawdopodobnie <span className="font-bold text-amber-600">skanem obrazkowym</span> lub plikiem, którego nie udało się przetworzyć automatycznie.
                                            </p>
                                            <p className="text-secondary/60 text-sm max-w-md mb-8">
                                                Treść jest dostępna wyłącznie w oryginalnym pliku PDF na stronie Sejmu.
                                            </p>
                                            <a
                                                href={project.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 rounded-xl font-bold transition-all flex items-center gap-2"
                                            >
                                                <Download size={16} />
                                                Pobierz oryginalny PDF
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

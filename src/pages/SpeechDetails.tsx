import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface Speech {
    id: number;
    mp_id: number | null;
    sitting: number;
    date: string;
    speaker_name: string;
    content: string;
    topic: string;
    ai_analysis: any; // JSONB
    mp?: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
    };
}

export default function SpeechDetails() {
    const { id } = useParams();
    const [speech, setSpeech] = useState<Speech | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSpeech = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('speeches')
                    .select(`
            *,
            ai_analysis,
            mp:mps(id, name, party, photo_url)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setSpeech(data);
            } catch (err) {
                console.error('Error fetching speech:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpeech();
    }, [id]);

    if (loading) return <div className="text-center py-12">Ładowanie wypowiedzi...</div>;

    if (!speech) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Nie znaleziono wypowiedzi.</p>
                <Link to="/wypowiedzi" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
                    Wróć do listy
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-24 pb-12 px-4 animate-fade-in">
            {/* Back Button */}
            <Link to="/wypowiedzi" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                <ArrowLeft size={20} />
                Wróć do wyszukiwarki
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                        {speech.mp ? (
                            <Link to={`/poslowie/${speech.mp.id}`} className="group">
                                <img
                                    src={speech.mp.photo_url}
                                    alt={speech.mp.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-blue-200 transition-colors"
                                />
                            </Link>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User size={32} />
                            </div>
                        )}

                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">
                                {speech.mp ? (
                                    <Link to={`/poslowie/${speech.mp.id}`} className="hover:text-blue-600 transition-colors">
                                        {speech.mp.name}
                                    </Link>
                                ) : (
                                    speech.speaker_name
                                )}
                            </h1>
                            {speech.mp && (
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                    {speech.mp.party}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-medium text-sm mb-2">
                            <Calendar size={16} />
                            {speech.date}
                        </div>
                        <p className="text-slate-500 text-sm">
                            Posiedzenie {speech.sitting}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Card / AI Analysis */}
            <div className={`rounded-xl border ${speech.ai_analysis ? 'bg-slate-950 border-indigo-900/50' : 'bg-white border-slate-200'} p-8 shadow-sm transition-all duration-500`}>

                {speech.ai_analysis ? (
                    /* AI GOD MODE VIEW */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between border-b border-indigo-900/50 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                                AI SPEECH COMPOSER
                            </h2>
                             <div className="text-xs font-mono text-indigo-300 bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-500/30">
                                EMOCJE: {speech.ai_analysis.summary?.emotion_level || "Analiza..."}
                             </div>
                        </div>

                        {/* LEGEND */}
                        <div className="flex flex-wrap gap-4 text-[10px] md:text-xs font-mono uppercase tracking-wider text-slate-500 border-b border-indigo-900/30 pb-4">
                             <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-900/20 border border-red-900/30 text-red-400">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>Strach / Agresja
                             </div>
                             <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-900/20 border border-green-900/30 text-green-400">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>Nadzieja / Wizja
                             </div>
                             <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-900/20 border border-amber-900/30 text-amber-400">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>Manipulacja
                             </div>
                             <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-900/20 border border-blue-900/30 text-blue-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>Weryfikacja
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 text-lg md:text-xl leading-relaxed font-mono text-slate-300">
                                {speech.ai_analysis.segments?.map((segment: any, idx: number) => {
                                    let className = "transition-all duration-300 mx-0.5 px-0.5 rounded ";
                                    if (segment.type === "fear") className += "bg-red-900/40 text-red-200 border-b border-red-500/50 shadow-[0_0_15px_-3px_rgba(220,38,38,0.2)]";
                                    if (segment.type === "manipulation") className += "bg-amber-900/20 text-amber-100 border-b-2 border-amber-500/50";
                                    if (segment.type === "lie") className += "bg-blue-900/40 text-blue-100 border-b-2 border-blue-500 relative group cursor-help";
                                    if (segment.type === "hope") className += "bg-green-900/20 text-green-200 border-b border-green-500/50";

                                    return (
                                        <span key={idx} className={className} title={segment.type?.toUpperCase()}>
                                            {segment.text}{" "}
                                            {segment.type === "lie" && (
                                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Sidebar Insights */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Wykryte Wątki</h3>
                                {speech.ai_analysis.segments?.filter((s: any) => s.fact_check).map((s: any, idx: number) => (
                                    <div key={idx} className="bg-slate-900/80 border-l-4 border-blue-500 rounded-r-lg p-4 text-sm animate-in fade-in slide-in-from-right" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="flex items-center gap-2 font-bold mb-2 text-blue-400">
                                            {s.type === 'lie' ? 'WERYFIKACJA' : 'KONTEKST'} <span className="text-slate-600 text-[10px] ml-auto">ID: {idx}X</span>
                                        </div>
                                        <div className="text-slate-400 italic mb-2 pl-2 border-l border-slate-700 clamp-2">"{s.text.slice(0, 50)}..."</div>
                                        <div className="text-slate-200 font-semibold">{s.fact_check}</div>
                                    </div>
                                ))}

                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 mt-8">
                                    <div className="text-xs text-slate-500 mb-2 uppercase">Wiarygodność</div>
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                        {speech.ai_analysis.summary?.credibility_score}%
                                    </div>
                                    <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" style={{ width: `${speech.ai_analysis.summary?.credibility_score}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* STANDARD VIEW */
                    <div className="prose prose-lg prose-slate max-w-none">
                        {speech.content.split('\n').map((paragraph, idx) => (
                            paragraph.trim() && <p key={idx} className="text-slate-800 leading-relaxed mb-4">{paragraph}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* Context/Topic (Placeholder) */}
            {/* <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 mb-1">Kontekst wypowiedzi</h3>
          <p className="text-blue-800 text-sm">
            Ta wypowiedź dotyczyła punktu porządku dziennego: "{speech.topic || 'Sprawozdanie Komisji...'}"
          </p>
        </div>
      </div> */}
        </div>
    );
}

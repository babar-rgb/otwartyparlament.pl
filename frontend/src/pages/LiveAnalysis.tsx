import { useState, useEffect } from 'react';
import { Mic, Pause, Play, RotateCcw, AlertTriangle, XCircle, Activity, Zap, Sparkles } from 'lucide-react';

export default function LiveAnalysis() {
    const [isRecording, setIsRecording] = useState(true);
    const [visibleChars, setVisibleChars] = useState(0);

    const fullText = [
        { text: "Drodzy Rodacy! Spotykamy się dzisiaj w cieniu ", type: "neutral" },
        { text: "nadciągającej katastrofy.", type: "fear" },
        { text: " ", type: "neutral" },
        { text: "Zagraniczne koncerny i brukselscy biurokraci chcą odebrać nam naszą tożsamość!", type: "manipulation" },
        { text: " Ale my mówimy głośne: DOŚĆ! Nie pozwolimy na dyktat elit.", type: "neutral" },
        { text: " ", type: "neutral" },
        { text: "W ciągu ostatniego roku wybudowaliśmy 5000 kilometrów autostrad,", type: "lie" },
        { text: " by połączyć Polskę od morza aż do Tatr. ", type: "neutral" },
        { text: "Nasz nowy program to 100% dopłaty do kredytu dla każdej młodej rodziny.", type: "hope" },
        { text: " ", type: "neutral" },
        { text: "Oni chcą waszej biedy, my chcemy waszego bogactwa!", type: "manipulation" },
        { text: " Zbudujemy potężną armię, której nikt nie odważy się zaatakować.", type: "hope" },
    ];

    // Typing effect simulation
    useEffect(() => {
        if (!isRecording) return;
        const interval = setInterval(() => {
            setVisibleChars(prev => {
                if (prev >= 1000) { // Limit
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isRecording]);

    const renderText = () => {
        let charCount = 0;
        return (
            <div className="text-xl md:text-3xl leading-relaxed font-mono font-bold">
                {fullText.map((segment, idx) => {
                    const charsInSegment = segment.text.length;
                    const start = charCount;
                    const end = charCount + charsInSegment;
                    charCount += charsInSegment;

                    if (visibleChars < start) return null;

                    const visiblePart = visibleChars >= end
                        ? segment.text
                        : segment.text.slice(0, visibleChars - start);

                    let className = "transition-all duration-300 ";
                    if (segment.type === "fear") className += "bg-red-500/10 text-red-700 dark:text-red-400 border-b-2 border-red-500/50 px-1 rounded-sm";
                    if (segment.type === "manipulation") className += "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b-2 border-amber-500/50 px-1 rounded-sm";
                    if (segment.type === "lie") className += "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500/50 relative group cursor-help px-1 rounded-sm";
                    if (segment.type === "hope") className += "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500/50 px-1 rounded-sm";

                    return (
                        <span key={idx} className={className}>
                            {visiblePart}
                            {segment.type === "lie" && visibleChars >= end && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                            )}
                        </span>
                    );
                })}
                <span className="inline-block w-2.5 h-8 bg-emerald-500 ml-1 animate-pulse align-middle"></span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-page dashboard-mesh text-primary pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* LEFT COLUMN: SPEECH */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4 text-primary tracking-tighter">
                            <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue shadow-lg shadow-accent-blue/5">
                                <Mic size={32} className="animate-pulse" />
                            </div>
                            Analiza <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-indigo-500">Na Żywo</span>
                        </h1>
                        <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                            <span className="text-red-700 dark:text-red-500 font-black text-xs tracking-widest uppercase">Nagrywanie</span>
                        </div>
                    </div>

                    {/* AUDIO VISUALIZER PLACEHOLDER */}
                    <div className="bg-surface/50 border border-border-base rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-10 text-[10px] font-mono whitespace-pre text-accent-blue pointer-events-none select-none">
                            01001010101
                            10101110010
                            11010101010
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">
                            <div className="flex items-center gap-3">
                                <Activity size={16} className="text-accent-blue" />
                                <span>Strumień Audio</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsRecording(!isRecording)} className="hover:text-accent-blue transition-colors">
                                    {isRecording ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button onClick={() => setVisibleChars(0)} className="hover:text-accent-blue transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end justify-between h-20 gap-1.5 px-4 bg-page/50 rounded-2xl p-4 border border-border-base/30">
                            {[...Array(60)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-accent-blue/40 dark:bg-accent-blue/60 rounded-t-sm w-full transition-all duration-75"
                                    style={{
                                        height: isRecording ? `${Math.random() * 80 + 20}%` : '10%',
                                        opacity: Math.max(0.3, Math.random())
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* SPEECH TEXT AREA */}
                    <div className="bg-surface/30 border border-border-base rounded-[3rem] p-10 min-h-[500px] shadow-2xl shadow-accent-blue/5 relative overflow-hidden backdrop-blur-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/[0.03] to-transparent pointer-events-none" />
                        <div className="relative z-10 text-primary">
                            {renderText()}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-base rounded-lg"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>Agresja</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-base rounded-lg"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>Nadzieja</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-base rounded-lg"><div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>Manipulacja</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-base rounded-lg"><div className="w-2.5 h-2.5 rounded-full bg-accent-blue/50 border border-accent-blue shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>Weryfikacja</div>
                    </div>
                </div>

                {/* RIGHT COLUMN: AI INSIGHTS */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-surface/80 backdrop-blur-2xl border border-accent-blue/20 rounded-[2.5rem] p-8 shadow-2xl shadow-accent-blue/5 md:sticky md:top-32">
                        <h3 className="text-xs font-black text-accent-blue tracking-[0.3em] mb-8 flex items-center gap-3 border-b border-border-base pb-6 uppercase">
                            <Zap size={16} fill="currentColor" /> Panel Analityczny
                        </h3>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-page/50 p-6 rounded-2xl border border-border-base/50 text-center group hover:border-emerald-500/30 transition-colors">
                                <div className="text-[10px] font-black text-secondary tracking-widest mb-2 uppercase group-hover:text-emerald-500 transition-colors">Wiarygodność</div>
                                <div className="text-4xl font-black text-emerald-500 font-mono italic">40%</div>
                            </div>
                            <div className="bg-page/50 p-6 rounded-2xl border border-border-base/50 text-center group hover:border-amber-500/30 transition-colors">
                                <div className="text-[10px] font-black text-secondary tracking-widest mb-2 uppercase group-hover:text-amber-500 transition-colors">Emocje</div>
                                <div className="text-3xl font-black text-amber-500 italic">Wysokie</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-4 rounded-r-xl text-[10px] text-emerald-500 font-black tracking-widest uppercase flex items-center gap-3">
                                <Sparkles size={14} /> WYKRYTO: TECHNIKA OBIETNICY
                            </div>
                            <div className="bg-amber-500/5 border-l-4 border-amber-500 p-4 rounded-r-xl text-[10px] text-amber-500 font-black tracking-widest uppercase flex items-center gap-3">
                                <AlertTriangle size={14} /> WYKRYTO: JĘZYK POPULISTYCZNY
                            </div>
                        </div>

                        {/* LIVE ALERTS STACK */}
                        <div className={`mt-12 space-y-6 transition-all duration-700 ${visibleChars > 200 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            {/* ALERT 1: MANIPULATION */}
                            {visibleChars > 150 && (
                                <div className="bg-surface border border-border-base rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 group-hover:scale-110 transition-transform"><AlertTriangle size={64} /></div>
                                    <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] mb-4 tracking-[0.2em] uppercase">
                                        <AlertTriangle size={14} /> Manipulacja <span className="text-secondary/30 ml-auto font-mono">ID: 604X</span>
                                    </div>
                                    <p className="text-secondary italic text-sm mb-4 border-l-2 border-border-base pl-4 line-clamp-2">
                                        "Nasz nowy program to 100% dopłaty do kredytu..."
                                    </p>
                                    <p className="text-sm font-bold text-primary bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                        Koszt programu szacowany na 20% PKB. Wysokie ryzyko inflacyjne.
                                    </p>
                                </div>
                            )}

                            {/* ALERT 2: FALSEHOOD */}
                            {visibleChars > 350 && (
                                <div className="bg-surface border border-border-base rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500 group-hover:scale-110 transition-transform"><XCircle size={64} /></div>
                                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] mb-4 tracking-[0.2em] uppercase">
                                        <XCircle size={14} /> Fałsz <span className="text-secondary/30 ml-auto font-mono">ID: 404X</span>
                                    </div>
                                    <p className="text-secondary italic text-sm mb-4 border-l-2 border-border-base pl-4 line-clamp-2">
                                        "W ciągu ostatniego roku wybudowaliśmy 5000 kilome..."
                                    </p>
                                    <p className="text-sm font-bold text-primary bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                                        Oficjalne raporty wykazują jedynie 320 km nowych dróg szybkiego ruchu.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Mic, Pause, Play, RotateCcw, ShieldCheck, AlertTriangle, XCircle, Activity, Zap } from 'lucide-react';

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
            <div className="text-xl md:text-2xl leading-relaxed font-mono">
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
                    if (segment.type === "fear") className += "bg-red-900/40 text-red-200 shadow-[0_0_10px_rgba(220,38,38,0.3)] px-1 rounded border-b border-red-500";
                    if (segment.type === "manipulation") className += "border-b-2 border-amber-400 text-amber-100 bg-amber-900/20";
                    if (segment.type === "lie") className += "bg-blue-900/40 border-b-2 border-blue-500 text-blue-100 relative group cursor-help";
                    if (segment.type === "hope") className += "bg-green-900/30 text-green-200 border-b border-green-500";

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
                <span className="inline-block w-2 h-6 bg-green-500 ml-1 animate-pulse align-middle"></span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 p-6 pt-24 font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: SPEECH */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            <Mic className="text-blue-500 animate-pulse" />
                            Analiza Live
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-red-500 font-mono text-sm tracking-widest font-bold">REC</span>
                        </div>
                    </div>

                    {/* AUDIO VISUALIZER PLACEHOLDER */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50 text-[10px] font-mono whitespace-pre text-green-500/30 pointer-events-none select-none">
                            01001010101
                            10101110010
                            11010101010
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-2">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" />
                                <span>AUDIO STREAM: 44.1kHz | PCM</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsRecording(!isRecording)} className="hover:text-white transition">
                                    {isRecording ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                                <button onClick={() => setVisibleChars(0)} className="hover:text-white transition">
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end justify-between h-12 gap-1 px-4">
                            {[...Array(40)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-blue-500/60 rounded-t-sm w-full transition-all duration-75"
                                    style={{
                                        height: isRecording ? `${Math.random() * 100}%` : '10%',
                                        opacity: Math.max(0.3, Math.random())
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* SPEECH TEXT AREA */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 min-h-[400px] shadow-2xl relative">
                        {renderText()}
                    </div>

                    <div className="flex gap-4 text-xs font-mono uppercase tracking-wider text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-900/40 border border-red-500"></div>Agresja</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-900/40 border border-green-500"></div>Nadzieja</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-900/20 border border-amber-400"></div>Manipulacja</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-900/40 border border-blue-500"></div>Weryfikacja</div>
                    </div>
                </div>

                {/* RIGHT COLUMN: AI INSIGHTS */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-2xl p-6 shadow-indigo-500/10 shadow-lg">
                        <h3 className="text-xs font-bold text-indigo-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Zap size={14} /> AI CORE ANALYSIS
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 mb-1">WIARYGODNOŚĆ</div>
                                <div className="text-2xl font-black text-green-400">40%</div>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 mb-1">EMOCJE</div>
                                <div className="text-2xl font-black text-amber-500">Wysokie</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-green-950/20 border-l-2 border-green-500 p-3 text-xs text-green-300 font-mono">
                                • WYKRYTO: TECHNIKA OBIETNICY
                            </div>
                            <div className="bg-amber-950/20 border-l-2 border-amber-500 p-3 text-xs text-amber-300 font-mono">
                                • WYKRYTO: JĘZYK POPULISTYCZNY
                            </div>
                        </div>
                    </div>

                    {/* LIVE ALERTS */}
                    <div className={`space-y-4 transition-all duration-500 ${visibleChars > 200 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        {/* ALERT 1: MANIPULATION */}
                        {visibleChars > 150 && (
                            <div className="bg-slate-900 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-lg animate-in fade-in slide-in-from-right relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle size={48} /></div>
                                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-2 tracking-wider">
                                    <AlertTriangle size={14} /> MANIPULACJA <span className="text-slate-600 ml-auto">ID: 604X</span>
                                </div>
                                <p className="text-slate-400 italic text-sm mb-2 border-l-2 border-slate-700 pl-2">
                                    "Nasz nowy program to 100% dopłaty do kredytu..."
                                </p>
                                <p className="text-sm font-semibold text-slate-200">
                                    Koszt programu to 20% PKB. Ryzyko inflacji.
                                </p>
                                <div className="mt-2 text-[10px] text-slate-500 uppercase">Źródło: Analiza Budżetowa</div>
                            </div>
                        )}

                        {/* ALERT 2: FALSEHOOD */}
                        {visibleChars > 350 && (
                            <div className="bg-slate-900 border-l-4 border-red-500 rounded-r-lg p-4 shadow-lg animate-in fade-in slide-in-from-right relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><XCircle size={48} /></div>
                                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mb-2 tracking-wider">
                                    <XCircle size={14} /> FAŁSZ <span className="text-slate-600 ml-auto">ID: 404X</span>
                                </div>
                                <p className="text-slate-400 italic text-sm mb-2 border-l-2 border-slate-700 pl-2">
                                    "W ciągu ostatniego roku wybudowaliśmy 5000 kilome..."
                                </p>
                                <p className="text-sm font-semibold text-slate-200">
                                    Oddano do użytku 320 km dróg szybkiego ruchu.
                                </p>
                                <div className="mt-2 text-[10px] text-slate-500 uppercase">Źródło: Raport GDDKiA 2023</div>
                            </div>
                        )}

                        {/* ALERT 3: MANIPULATION */}
                        {visibleChars > 500 && (
                            <div className="bg-slate-900 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-lg animate-in fade-in slide-in-from-right relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle size={48} /></div>
                                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-2 tracking-wider">
                                    <AlertTriangle size={14} /> MANIPULACJA <span className="text-slate-600 ml-auto">ID: 204X</span>
                                </div>
                                <p className="text-slate-400 italic text-sm mb-2 border-l-2 border-slate-700 pl-2">
                                    "Zagraniczne koncerny i brukselscy biurokraci chcą..."
                                </p>
                                <p className="text-sm font-semibold text-slate-200">
                                    Brak zapisów naruszających suwerenność kulturową.
                                </p>
                                <div className="mt-2 text-[10px] text-slate-500 uppercase">Źródło: Analiza Traktatów UE</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

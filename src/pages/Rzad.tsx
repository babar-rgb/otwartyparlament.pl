
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, AlertTriangle, CheckCircle, Target } from 'lucide-react';

const MINISTRY_DATA = [
    { name: 'Min. Cyfryzacji', plan: 100, execution: 98, color: '#10b981' },
    { name: 'Min. Obrony', plan: 100, execution: 95, color: '#10b981' },
    { name: 'Min. Edukacji', plan: 100, execution: 85, color: '#f59e0b' },
    { name: 'Min. Zdrowia', plan: 100, execution: 82, color: '#f59e0b' },
    { name: 'Min. Infrastruktury', plan: 100, execution: 65, color: '#ef4444' },
    { name: 'Min. Klimatu', plan: 100, execution: 55, color: '#ef4444' },
];

const WARNINGS = [
    { ministry: 'Ministerstwo Klimatu', issue: 'Niewykorzystane środki na transformację energetyczną (zagrożenie przepadnięciem dotacji UE).', severity: 'critical' },
    { ministry: 'Ministerstwo Infrastruktury', issue: 'Opóźnienia w przetargach drogowych spowodowały niskie wykonanie budżetu w Q3.', severity: 'critical' },
    { ministry: 'Ministerstwo Finansów', issue: 'Nagły wzrost wydatków "różnych" w grudniu (+300% r/r).', severity: 'warning' },
];

const Rzad = () => {
    return (
        <div className="min-h-screen bg-page pt-32 pb-16 px-4 md:px-8 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full font-bold text-[10px] uppercase tracking-wider mb-6 border border-blue-500/20">
                        <Target size={14} />
                        <span>Kontrola Obywatelska</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-primary mb-6 tracking-tight leading-tight">
                        Efektywność Rządu <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 underline decoration-blue-500/20 underline-offset-8">w Liczbach.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-secondary max-w-2xl leading-relaxed">
                        Sprawdzamy, które ministerstwa realizują swoje plany, a które mają problemy z wdrażaniem budżetu.
                        Analiza oparta na oficjalnych sprawozdaniach Ministerstwa Finansów.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Efficiency Chart Container - Styled like Methodology */}
                    <div className="lg:col-span-2 bg-surface p-8 md:p-10 rounded-[2.5rem] border border-border-base shadow-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-primary italic">Ranking Wykonania</h2>
                                <p className="text-xs text-secondary mt-1">Stan na koniec Q3 2024</p>
                            </div>

                            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Plan
                                </div>
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div> Zator
                                </div>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MINISTRY_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', padding: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="execution" radius={[0, 6, 6, 0] as any} barSize={24} background={{ fill: 'rgba(148, 163, 184, 0.05)', radius: [0, 6, 6, 0] }}>
                                        {MINISTRY_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Critical Issues / Alerts - Styled like Side Cards */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold px-2">
                            <AlertTriangle className="text-amber-500" size={18} />
                            <span>Wykryte Anomalie</span>
                        </div>

                        {WARNINGS.map((warn, index) => (
                            <div key={index} className="group p-6 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                {warn.severity === 'critical' && <div className="absolute top-0 right-0 w-2 h-full bg-red-500/20" />}

                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg ${warn.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                        <TrendingDown size={16} />
                                    </div>
                                    <h3 className="font-bold text-primary text-sm pt-1.5">{warn.ministry}</h3>
                                </div>
                                <p className="text-xs text-secondary leading-relaxed pl-1">
                                    {warn.issue}
                                </p>
                            </div>
                        ))}

                        <div className="p-6 rounded-3xl bg-surface border border-border-base opacity-60 hover:opacity-100 transition-opacity cursor-help">
                            <h4 className="font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-secondary">
                                <CheckCircle className="text-emerald-500" size={14} /> Metodologia
                            </h4>
                            <p className="text-[10px] text-secondary leading-relaxed">
                                Dane pochodzą z miesięcznych sprawozdań budżetowych Ministerstwa Finansów.
                                Analiza odchyleń od planu rocznego oraz sezonowość.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rzad;

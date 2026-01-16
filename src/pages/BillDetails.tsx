import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, Tag, CheckCircle2, XCircle, ArrowRight, Network } from 'lucide-react';
import BillTimeline from '../components/BillTimeline';
import ProcessTLDR from '../components/ProcessTLDR';
import { formatPolishDate } from '../utils/dateUtils';
import { useBillDetails } from '../hooks/useBillDetails';
import SEO from '../components/SEO';

export default function BillDetails() {
    const { id } = useParams();
    const { data, isLoading: loading } = useBillDetails(id);

    const bill = data?.bill;
    const relatedVotes = data?.relatedVotes || [];
    const relatedProcesses = data?.relatedProcesses || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen pt-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Nie znaleziono procesu legislacyjnego.</h1>
                <Link to="/projekty" className="text-blue-600 hover:underline mt-4 inline-block">Powrót</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            <SEO
                title={`Druk ${bill.printNumber} - ${bill.title.substring(0, 60)}...`}
                description={bill.description || `Projekt ustawy ${bill.printNumber}. Wnioskodawca: ${bill.proposer}. Data: ${formatPolishDate(bill.date)}.`}
                url={`/ustawy/${id}`}
            />
            <Link to="/projekty" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Powrót do listy
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                            <FileText size={14} />
                            Druk nr {bill.printNumber}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium border border-slate-200">
                            <Calendar size={14} />
                            {formatPolishDate(bill.date)}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium border border-slate-200">
                            <User size={14} />
                            {bill.proposer}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                        {bill.title}
                    </h1>

                    {/* Reader-friendly description */}
                    <div className="prose prose-lg prose-slate max-w-[65ch]">
                        <p className="text-lg text-slate-600 leading-[1.8] font-serif">
                            {bill.description}
                        </p>
                    </div>

                    {/* Law Map CTA */}
                    <div className="mt-8">
                        <Link
                            to={`/mapa/${bill.id}`}
                            className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] transition-all group"
                        >
                            <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                                <Network size={24} />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium opacity-90">Nowość</div>
                                <div className="text-lg">Zobacz Mapę Myśli Prawa</div>
                            </div>
                            <ArrowRight className="ml-2 opacity-80 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* AI TL;DR Section */}
                {bill.ai_analysis && (
                    <div className="px-8 pt-8 bg-white">
                        <ProcessTLDR data={{
                            tldr: bill.ai_analysis.summary,
                            what_changes: bill.ai_analysis.summary,
                            who_affected: [bill.ai_analysis.impact],
                            pros: bill.ai_analysis.pros,
                            cons: bill.ai_analysis.cons
                        }} />
                    </div>
                )}

                {/* Timeline Section */}
                <div className="p-8 bg-white">
                    <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <Tag className="text-blue-500" />
                        Przebieg procesu legislacyjnego
                    </h2>

                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                        <BillTimeline currentStage={bill.currentStage} status={bill.status} />
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 p-8 border-t border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4">Dokumenty</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href={`https://www.sejm.gov.pl/Sejm10.nsf/PrzebiegProc.xsp?nr=${bill.printNumber}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                    <FileText size={16} />
                                    Zobacz na stronie Sejmu
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4">Powiązane głosowania</h3>
                        {relatedVotes.length > 0 ? (
                            <div className="space-y-3">
                                {relatedVotes.map((vote) => (
                                    <Link
                                        key={vote.id}
                                        to={`/glosowania/${vote.sitting}/${vote.voting_number}`}
                                        className="block p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-medium text-slate-500">
                                                {formatPolishDate(vote.date)}
                                            </span>
                                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${vote.verdict === 'PRZYJĘTO'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {vote.verdict === 'PRZYJĘTO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {vote.verdict}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {vote.title_clean}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex gap-2">
                                                <span className="text-green-600 font-medium">Za: {vote.details_json?.yes || 0}</span>
                                                <span className="text-red-600 font-medium">Przeciw: {vote.details_json?.no || 0}</span>
                                            </div>
                                            <div className="flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Szczegóły <ArrowRight size={12} className="ml-1" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">Brak powiązanych głosowań w bazie.</p>
                        )}
                    </div>
                </div>

                {/* Semantic Context Section */}
                {relatedProcesses.length > 0 && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Network className="text-purple-500" size={20} />
                            Podobne Projekty
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {relatedProcesses.map((rel: any) => (
                                <Link
                                    key={rel.id}
                                    to={`/projekty/${rel.id}`}
                                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group flex flex-col h-full"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                                            {rel.type || 'Projekt'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            Druk {rel.number || rel.print_number}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors flex-grow">
                                        {rel.title}
                                    </h4>
                                    <div className="flex items-center text-xs font-bold text-purple-600">
                                        Zobacz szczegóły <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

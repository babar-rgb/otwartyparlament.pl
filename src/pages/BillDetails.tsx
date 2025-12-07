import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, Tag, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import BillTimeline, { TimelineStage } from '../components/BillTimeline';
import ProcessTLDR from '../components/ProcessTLDR';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BillData {
    id: string;
    title: string;
    description: string;
    printNumber: string;
    date: string;
    proposer: string;
    currentStage: TimelineStage;
    status: 'processing' | 'passed' | 'rejected';
    simple_summary?: any;
}

interface RelatedVote {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    verdict: string;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
}

export default function BillDetails() {
    const { id } = useParams();
    const [bill, setBill] = useState<BillData | null>(null);
    const [relatedVotes, setRelatedVotes] = useState<RelatedVote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBillDetails = async () => {
            try {
                // Fetch basic info from Local DB
                // Assuming ID in URL is the Print Number or Process ID
                // My ETL used Print Number as ID
                const { data, error } = await supabase
                    .from('processes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Process not found locally");

                // Mock Stages for now (as we didn't ETL deep stages yet)
                // TODO: Enhance ETL to fetch stages
                const currentStage: TimelineStage = 'committee';
                const status: 'processing' | 'passed' | 'rejected' = 'processing';

                setBill({
                    id: data.id,
                    title: data.title,
                    description: data.description || 'Brak opisu.',
                    printNumber: data.print_number || 'Brak',
                    date: data.process_start_date,
                    proposer: 'Sejm RP',
                    currentStage,
                    status,
                    simple_summary: data.simple_summary
                });

                // Fetch related votes
                if (data.print_number) {
                    const { data: votesData, error: votesError } = await supabase
                        .from('votes')
                        .select('*')
                        .eq('print_number', data.print_number)
                        .order('date', { ascending: false });

                    if (!votesError && votesData) {
                        setRelatedVotes(votesData);
                    }
                }

            } catch (error) {
                console.error('Error fetching bill locally:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBillDetails();
    }, [id]);

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
                            {bill.date}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium border border-slate-200">
                            <User size={14} />
                            {bill.proposer}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                        {bill.title}
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                        {bill.description}
                    </p>
                </div>

                {/* AI TL;DR Section */}
                {bill.simple_summary && (
                    <div className="px-8 pt-8 bg-white">
                        <ProcessTLDR data={bill.simple_summary} />
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
                                                {new Date(vote.date).toLocaleDateString('pl-PL')}
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
            </div>
        </div>
    );
}

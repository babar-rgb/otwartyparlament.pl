import { useState, useEffect } from 'react';
import { db } from '../lib/db';

interface VoteDetail {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    title_raw?: string;
    verdict: string;
    print_number: string | null;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
        notParticipating: number;
    };
    importance_score?: number;
    topic_tag?: string;
    semantic_weight?: number;
}

interface VoteResult {
    vote: string;
    mps: {
        name: string;
        party: string;
        photo_url: string;
        slug: string;
        id: number;
    };
}

interface PartyStats {
    yes: number;
    no: number;
    abstain: number;
    absent: number;
}

export function useVoteDetails(id?: string, sitting?: string, votingNumber?: string, term?: string) {
    const [vote, setVote] = useState<VoteDetail | null>(null);
    const [results, setResults] = useState<VoteResult[]>([]);
    const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<{ summary: string; pros: string[]; cons: string[] } | null>(null);
    const [linkedProcessId, setLinkedProcessId] = useState<string | null>(null);
    const [linkedPrint, setLinkedPrint] = useState<{ number: string; title: string } | null>(null);
    const [projectContext, setProjectContext] = useState<{ ai_summary: string; justification_text: string; pdf_url: string } | null>(null);

    useEffect(() => {
        if (id || (sitting && votingNumber)) {
            fetchVoteDetails();
        } else {
            console.warn("Invalid parameters for VoteDetails");
            setLoading(false);
        }
    }, [id, sitting, votingNumber, term]);

    const fetchVoteDetails = async () => {
        setLoading(true);
        const termId = term ? parseInt(term) : 10;
        try {
            // 1. Fetch Vote Metadata
            let query = db.from('votes').select('*');

            if (id) {
                query = query.eq('id', id);
            } else {
                query = query
                    .eq('sitting', sitting)
                    .eq('voting_number', votingNumber)
                    .eq('term', termId);
            }

            const { data: voteData, error: voteError } = await query.single();

            if (voteError) throw voteError;
            setVote(voteData);

            // 2. Fetch Individual Results (Get MP IDs first)
            const { data: resultsDataRaw, error: resultsError } = await db
                .from('vote_results')
                .select('result, mp_id')
                .eq('vote_id', voteData.id)
                .limit(460);

            if (resultsError) throw resultsError;

            // 3. Fetch MPs efficiently
            const mpIds = resultsDataRaw.map((r: any) => r.mp_id);
            const { data: mpsData, error: mpsError } = await db
                .from('mps')
                .select('id, name, party, photo_url, seat_number, slug')
                .in('id', mpIds);

            if (mpsError) throw mpsError;

            // 4. Manual Join & Value Mapping
            const mpMap = new Map(mpsData?.map((mp: any) => [mp.id, mp]));
            const typedResults: VoteResult[] = resultsDataRaw.map((r: any) => {
                // Map results from DB (can be Polish "Za" or English "YES") to English frontend constants
                let normalizedVote = 'ABSENT';
                const res = r.result?.toUpperCase();

                if (res === 'ZA' || res === 'YES') normalizedVote = 'YES';
                else if (res === 'PRZECIW' || res === 'NO') normalizedVote = 'NO';
                else if (res === 'WSTRZYMAŁ SIĘ' || res === 'ABSTAIN') normalizedVote = 'ABSTAIN';
                else if (res === 'NIEOBECNY' || res === 'ABSENT') normalizedVote = 'ABSENT';

                return {
                    vote: normalizedVote,
                    mps: mpMap.get(r.mp_id)
                };
            });

            setResults(typedResults);

            // 5. Calculate Party Stats
            const stats: Record<string, { yes: number; no: number; abstain: number; absent: number }> = {};

            typedResults.forEach(r => {
                const party = r.mps?.party || 'Niezrzeszeni';
                if (!stats[party]) {
                    stats[party] = { yes: 0, no: 0, abstain: 0, absent: 0 };
                }

                if (r.vote === 'YES') stats[party].yes++;
                else if (r.vote === 'NO') stats[party].no++;
                else if (r.vote === 'ABSTAIN') stats[party].abstain++;
                else stats[party].absent++;
            });

            setPartyStats(stats);

            // 4. Fetch AI Analysis
            const { data: analysisData, error: analysisError } = await db
                .from('vote_analyses')
                .select('summary, pros, cons')
                .eq('vote_id', voteData.id)
                .single();

            if (!analysisError && analysisData) {
                setAnalysis(analysisData);
            }

            // 5. Try to link to Law Map (Process) & Project Context
            if (voteData.print_number) {
                // Fetch Process ID
                const { data: procData } = await db
                    .from('processes')
                    .select('id')
                    .ilike('print_number', `${voteData.print_number}%`)
                    .limit(1)
                    .maybeSingle();

                if (procData) {
                    setLinkedProcessId(procData.id);
                }

                // Fetch Sejm Print Details
                const { data: printData } = await db
                    .from('sejm_prints')
                    .select('number, title')
                    .eq('number', voteData.print_number)
                    .maybeSingle();

                if (printData) {
                    setLinkedPrint(printData);
                }

                // Fetch Bill Insights (Project Context from PDF)
                const { data: insightsData } = await db
                    .from('bill_insights')
                    .select('ai_summary, justification_text, pdf_url')
                    .eq('print_number', voteData.print_number)
                    .maybeSingle();

                if (insightsData) {
                    setProjectContext(insightsData);
                }
            }

        } catch (error) {
            console.error('Error fetching vote details:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        vote,
        results,
        partyStats,
        loading,
        analysis,
        linkedProcessId,
        linkedPrint,
        projectContext
    };
}

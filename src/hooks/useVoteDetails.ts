import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVote, fetchVoteAnalysis, fetchVotes, fetchVoteResultsDetailed, fetchProcess, generateVoteAnalysis } from '../api';
import { Vote } from '../types/domain';
import { formatMPName, extractPrintNumber } from '../utils';

interface VoteDetail extends Vote {
    details_json: {
        yes: number;
        no: number;
        abstain: number;
        notParticipating: number;
    };
    topic_tag?: string;
    importance_score?: number;
    print_number?: string | null;
}

interface VoteResult {
    vote: string;
    mps: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
        slug: string;
    };
}

interface PartyStats {
    yes: number;
    no: number;
    abstain: number;
    absent: number;
}

export function useVoteDetails(id?: string, sitting?: string, votingNumber?: string, term?: string) {
    const queryClient = useQueryClient();

    const queryKey = ['voteDetails', id || `${term}-${sitting}-${votingNumber}`];

    const { data, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            let voteData: Vote | undefined;

            // 1. Fetch Basic Vote Data
            if (id) {
                voteData = await fetchVote(id);
            } else {
                const termNum = term ? parseInt(term) : undefined;
                const sittingNum = sitting ? parseInt(sitting) : undefined;
                const votingNumberNum = votingNumber ? parseInt(votingNumber) : undefined;

                const { items } = await fetchVotes({
                    term: termNum,
                    sitting: sittingNum,
                    voting_number: votingNumberNum,
                    limit: 1
                });
                voteData = items[0];
            }

            if (!voteData) throw new Error("Vote not found");

            const vote: VoteDetail = {
                ...voteData,
                details_json: {
                    yes: voteData.for || 0,
                    no: voteData.against || 0,
                    abstain: voteData.abstained || 0,
                    notParticipating: voteData.absent || 0
                },
                print_number: null
            };

            // 2. Concurrent Data Fetching
            const printNum = extractPrintNumber(voteData.title_clean || voteData.title_raw || "");

            const [aiData, resultsData, process] = await Promise.all([
                fetchVoteAnalysis(voteData.id.toString()).catch(() => null),
                fetchVoteResultsDetailed(voteData.id).catch(() => []),
                printNum ? fetchProcess(printNum).catch(() => null) : Promise.resolve(null)
            ]);

            // 3. Process Linked Print / Project Context
            let linkedPrint = null;
            let projectContext = null;
            let linkedProcessId = null;

            if (process) {
                linkedPrint = { number: process.number, title: process.title };
                const summary = process.ai_analysis?.summary || process.description || "";
                if (summary) {
                    projectContext = {
                        ai_summary: summary,
                        justification_text: process.description || "",
                        pdf_url: process.url || ""
                    };
                }
                if (process.process_id) linkedProcessId = process.process_id;
            }

            // 4. Process Analysis
            const analysis = aiData ? {
                summary: aiData.summary,
                pros: aiData.pros,
                cons: aiData.cons,
                procedural_context: aiData.procedural_context
            } : null;

            // 5. Process Results & Party Stats
            const results: VoteResult[] = resultsData
                .filter((r: any) => r && r.mp)
                .map((r: any) => {
                    let normalizedVote = 'ABSENT';
                    const voteStr = r.result?.toUpperCase();
                    if (voteStr === 'ZA' || voteStr === 'YES') normalizedVote = 'YES';
                    else if (voteStr === 'PRZECIW' || voteStr === 'NO') normalizedVote = 'NO';
                    else if (voteStr === 'WSTRZYMAŁ SIĘ' || voteStr === 'ABSTAIN' || voteStr === 'ABSTAINED') normalizedVote = 'ABSTAIN';
                    else if (voteStr === 'NIEOBECNY' || voteStr === 'ABSENT') normalizedVote = 'ABSENT';

                    return {
                        vote: normalizedVote,
                        mps: {
                            id: r.mp.id,
                            name: formatMPName(r.mp.first_name, r.mp.last_name),
                            party: r.mp.club || 'Niezrzeszeni',
                            photo_url: r.mp.photo_url || '',
                            slug: r.mp.slug || r.mp.id.toString()
                        }
                    };
                });

            const partyStats: Record<string, PartyStats> = {};
            results.forEach(r => {
                const party = r.mps.party || 'Niezrzeszeni';
                if (!partyStats[party]) partyStats[party] = { yes: 0, no: 0, abstain: 0, absent: 0 };

                if (r.vote === 'YES') partyStats[party].yes++;
                else if (r.vote === 'NO') partyStats[party].no++;
                else if (r.vote === 'ABSTAIN') partyStats[party].abstain++;
                else partyStats[party].absent++;
            });

            return {
                vote,
                results,
                partyStats,
                analysis,
                linkedProcessId,
                linkedPrint,
                projectContext
            };
        },
        enabled: !!(id || (sitting && votingNumber)),
        staleTime: 1000 * 60 * 10, // Vote details don't change often
    });

    // Mutation for generating analysis
    const analysisMutation = useMutation({
        mutationFn: async (voteId: string) => {
            return await generateVoteAnalysis(voteId);
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const generateAnalysis = async () => {
        if (data?.vote) {
            analysisMutation.mutate(data.vote.id.toString());
        }
    };

    if (error) {
        console.error('Error fetching vote details:', error);
    }

    return {
        vote: data?.vote || null,
        results: data?.results || [],
        partyStats: data?.partyStats || {},
        loading: loading || analysisMutation.isPending,
        analysis: data?.analysis || null,
        linkedProcessId: data?.linkedProcessId || null,
        linkedPrint: data?.linkedPrint || null,
        projectContext: data?.projectContext || null,
        generateAnalysis
    };
}

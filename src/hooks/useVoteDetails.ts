import { useState, useEffect } from 'react';
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
    const [vote, setVote] = useState<VoteDetail | null>(null);
    const [results, setResults] = useState<VoteResult[]>([]);
    const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<{ summary: string; pros: string[]; cons: string[]; procedural_context?: string } | null>(null);
    const [linkedProcessId, _setLinkedProcessId] = useState<string | null>(null);
    const [linkedPrint, _setLinkedPrint] = useState<{ number: string; title: string } | null>(null);
    const [projectContext, _setProjectContext] = useState<{ ai_summary: string; justification_text: string; pdf_url: string } | null>(null);

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
        try {
            let voteData: Vote | undefined;

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

            const fullVote: VoteDetail = {
                ...voteData,
                details_json: {
                    yes: voteData.for || 0,
                    no: voteData.against || 0,
                    abstain: voteData.abstained || 0,
                    notParticipating: voteData.absent || 0
                },
                print_number: null
            };

            setVote(fullVote);

            // 1b. Fetch Linked Process / Bill (Goal B)
            const printNum = extractPrintNumber(voteData.title_clean || voteData.title_raw || "");
            if (printNum) {
                try {
                    const process = await fetchProcess(printNum);
                    if (process) {
                        _setLinkedPrint({ number: process.number, title: process.title });

                        // If we have a description or AI analysis, use it
                        const summary = process.ai_analysis?.summary || process.description || "";

                        if (summary) {
                            _setProjectContext({
                                ai_summary: summary,
                                justification_text: process.description || "",
                                pdf_url: process.url || ""
                            });
                        }

                        if (process.process_id) _setLinkedProcessId(process.process_id);
                    }
                } catch (err) {
                    console.log("No linked process found for print", printNum);
                }
            }

            // 2. Fetch Analysis (The AI Part)
            const aiData = await fetchVoteAnalysis(voteData.id.toString());
            if (aiData) {
                setAnalysis({
                    summary: aiData.summary,
                    pros: aiData.pros,
                    cons: aiData.cons,
                    procedural_context: aiData.procedural_context
                });
            }

            // 3. Fetch Results from our new Backend endpoint
            try {
                const resultsData = await fetchVoteResultsDetailed(voteData.id);

                const typedResults: VoteResult[] = resultsData
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

                setResults(typedResults);

                const stats: Record<string, PartyStats> = {};
                typedResults.forEach(r => {
                    const party = r.mps.party || 'Niezrzeszeni';
                    if (!stats[party]) stats[party] = { yes: 0, no: 0, abstain: 0, absent: 0 };

                    if (r.vote === 'YES') stats[party].yes++;
                    else if (r.vote === 'NO') stats[party].no++;
                    else if (r.vote === 'ABSTAIN') stats[party].abstain++;
                    else stats[party].absent++;
                });
                setPartyStats(stats);
            } catch (err) {
                console.error("Failed to load detailed results:", err);
                // Non-fatal, just no details
            }

        } catch (error) {
            console.error('Error fetching vote details:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAnalysis = async () => {
        if (!vote) return;
        setLoading(true);
        try {
            const aiData = await generateVoteAnalysis(vote.id.toString());
            if (aiData) {
                setAnalysis({
                    summary: aiData.summary,
                    pros: aiData.pros,
                    cons: aiData.cons,
                    procedural_context: aiData.procedural_context
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return {
        vote,
        results,
        partyStats,
        loading,
        analysis,
        linkedProcessId,
        linkedPrint,
        projectContext,
        generateAnalysis
    };
}

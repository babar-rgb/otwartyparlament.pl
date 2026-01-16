import { useQuery } from '@tanstack/react-query';
import { fetchProcess, fetchVotes, fetchRelatedProcesses } from '../api';
import { TimelineStage } from '../components/BillTimeline';

export interface BillData {
    id: string;
    title: string;
    description: string;
    printNumber: string;
    date: string;
    proposer: string;
    currentStage: TimelineStage;
    status: 'processing' | 'passed' | 'rejected';
    ai_analysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        impact: string;
        importance: number;
    } | null;
}

export interface RelatedVote {
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

export function useBillDetails(id: string | undefined) {
    return useQuery({
        queryKey: ['billDetails', id],
        queryFn: async () => {
            if (!id) return null;

            // 1. Fetch main process data
            const data = await fetchProcess(id);

            // 2. Mock/Compute stages
            const currentStage: TimelineStage = 'committee';
            const status: 'processing' | 'passed' | 'rejected' = 'processing';

            const bill: BillData = {
                id: data.id,
                title: data.title,
                description: data.description || 'Brak opisu.',
                printNumber: data.print_number || 'Brak',
                date: data.process_start_date,
                proposer: 'Sejm RP',
                currentStage,
                status,
                ai_analysis: data.ai_analysis
            };

            // 3. Fetch related votes (Concurrent if needed, but here simple)
            let relatedVotes: RelatedVote[] = [];
            if (data.print_number) {
                const { items: votesData } = await fetchVotes({ limit: 50 });
                relatedVotes = votesData as unknown as RelatedVote[];
            }

            // 4. Fetch related processes
            const relatedProcesses = await fetchRelatedProcesses(id);

            return { bill, relatedVotes, relatedProcesses };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

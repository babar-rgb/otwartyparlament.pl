import { useQuery } from '@tanstack/react-query';
import { fetchCommittees } from '../api';

export function useCommittees() {
    return useQuery({
        queryKey: ['committees'],
        queryFn: async () => {
            const commData = await fetchCommittees();
            return commData.map((c: any) => ({
                ...c,
                member_count: c.member_count || 0,
                sitting_count: c.sitting_count || 0
            }));
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

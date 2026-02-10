import { useQuery } from '@tanstack/react-query';
import { fetchVotes } from '../api';

export function useCategoryDetails(categoryName: string, showKeyOnly: boolean) {
    return useQuery({
        queryKey: ['categoryDetails', categoryName, showKeyOnly],
        queryFn: async () => {
            const { items } = await fetchVotes({ limit: 100 });

            let filtered = items.filter((v: any) =>
                v.topic?.toUpperCase() === categoryName ||
                (v.tags && v.tags.map((t: string) => t.toUpperCase()).includes(categoryName))
            );

            if (showKeyOnly) {
                filtered = filtered.filter((v: any) => v.importance === 'High' || v.is_key_vote);
            }

            const stats = {
                total: filtered.length,
                accepted: filtered.filter((v: any) => v.verdict === 'PRZYJĘTO').length,
                rejected: filtered.filter((v: any) => v.verdict !== 'PRZYJĘTO').length,
            };

            return { votes: filtered, stats };
        },
        enabled: !!categoryName,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

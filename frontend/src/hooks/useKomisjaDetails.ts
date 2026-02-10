import { useQuery } from '@tanstack/react-query';
import { fetchCommittee } from '../api';

export function useKomisjaDetails(code: string | undefined) {
    return useQuery({
        queryKey: ['committeeDetails', code],
        queryFn: async () => {
            if (!code) return null;
            const data = await fetchCommittee(code);

            // Enrich members if present
            const members = (data.members || []).map((m: any) => ({
                mp_id: m.mp_id,
                function: m.function,
                mps: m.mp ? {
                    id: m.mp.id,
                    first_name: m.mp.first_name,
                    last_name: m.mp.last_name,
                    club: m.mp.club,
                    photo_url: m.mp.photo_url,
                    slug: m.mp.slug
                } : null
            }));

            return {
                committee: data.committee,
                members,
                sittings: data.sittings || [],
                totalSittings: data.total_sittings || (data.sittings?.length || 0)
            };
        },
        enabled: !!code,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

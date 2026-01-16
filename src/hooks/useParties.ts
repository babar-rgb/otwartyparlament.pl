import { useQuery } from '@tanstack/react-query';
import { fetchParties } from '../api';

export function useParties() {
    return useQuery({
        queryKey: ['partiesList'],
        queryFn: async () => {
            const data = await fetchParties();
            const config: Record<string, { color: string, name: string, logo: string }> = {};

            if (data) {
                data.forEach((p: any) => {
                    config[p.id] = {
                        color: p.color,
                        name: p.name,
                        logo: p.logo_url
                    };
                });
            }

            return config;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

import { useQuery } from '@tanstack/react-query';
import { fetchWealthRankings } from '../api';

export interface WealthData {
    mp_id: number;
    name: string;
    party: string;
    photo_url: string;
    savings: number;
    income: number;
    properties_count: number;
    summary: string;
    year?: string;
}

export function useWealthRankings() {
    return useQuery({
        queryKey: ['wealthRankings'],
        queryFn: async () => {
            const mps = await fetchWealthRankings();

            const parseAmount = (val: any): number => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const clean = val.replace(/[^\d.,-]/g, '').replace(',', '.');
                    return parseFloat(clean) || 0;
                }
                return 0;
            };

            const processed: WealthData[] = mps
                .map((mp: any) => {
                    const sortedDeclarations = (mp.asset_declarations || [])
                        .filter((d: any) => d && d.parsed_content)
                        .sort((a: any, b: any) => {
                            const yearA = a.year || '0000';
                            const yearB = b.year || '0000';
                            return yearB.localeCompare(yearA);
                        });

                    const decl = sortedDeclarations[0];
                    if (!decl) return null;

                    return {
                        mp_id: mp.id,
                        name: `${mp.first_name} ${mp.last_name}`,
                        party: mp.club,
                        photo_url: mp.photo_url,
                        savings: parseAmount(decl.parsed_content.savings),
                        income: parseAmount(decl.parsed_content.income),
                        properties_count: decl.parsed_content.real_estate?.length || 0,
                        summary: decl.summary,
                        year: decl.year
                    };
                })
                .filter(Boolean) as WealthData[];

            return processed;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

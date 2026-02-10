import { useQuery } from '@tanstack/react-query';
import { fetchInterpellations, fetchMP, fetchInterpellationsCount } from '../api';

export function useInterpellationsList(options: {
    mpId?: string | null,
    page: number,
    pageSize: number,
    query?: string
}) {
    const { mpId, page, pageSize, query } = options;

    // 1. Fetch Total Count
    const { data: totalCount = 0 } = useQuery({
        queryKey: ['interpellationsCount'],
        queryFn: fetchInterpellationsCount,
        staleTime: 1000 * 60 * 10,
    });

    // 2. Fetch MP name if filtered
    const { data: mpName } = useQuery({
        queryKey: ['mpName', mpId],
        queryFn: async () => {
            if (!mpId) return '';
            const mp = await fetchMP(mpId);
            return `${mp.first_name} ${mp.last_name}`;
        },
        enabled: !!mpId,
        staleTime: 1000 * 60 * 60,
    });

    // 3. Fetch Interpellations
    const { data: interpellations = [], isLoading: loading, error } = useQuery({
        queryKey: ['interpellations', mpId, page, pageSize, query],
        queryFn: async () => {
            const skip = (page - 1) * pageSize;

            // If searching, we fetch more items to allow client-side filtering if backend doesn't support full q search yet 
            // (or to match legacy logic which seems to do some client filtering)
            const fetchOptions: any = {
                limit: query ? 100 : pageSize,
                skip: query ? 0 : skip
            };
            if (mpId) fetchOptions.mp_id = parseInt(mpId);

            let data = await fetchInterpellations(fetchOptions);

            if (query) {
                const normalizedQuery = query.toLowerCase();
                data = data.filter((item: any) =>
                    (item.title?.toLowerCase() || '').includes(normalizedQuery) ||
                    (item.content?.toLowerCase() || '').includes(normalizedQuery)
                );
            }

            return data;
        },
        staleTime: 1000 * 60 * 2,
    });

    return {
        interpellations,
        totalCount,
        mpName,
        loading,
        error
    };
}

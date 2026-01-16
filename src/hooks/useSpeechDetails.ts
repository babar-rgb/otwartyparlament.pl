import { useQuery } from '@tanstack/react-query';
import { fetchSpeech } from '../api';

export function useSpeechDetails(id: string | undefined) {
    return useQuery({
        queryKey: ['speechDetails', id],
        queryFn: async () => {
            if (!id) return null;
            return await fetchSpeech(id);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

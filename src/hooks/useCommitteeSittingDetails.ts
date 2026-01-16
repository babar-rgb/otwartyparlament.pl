import { useQuery } from '@tanstack/react-query';
import { fetchCommitteeSitting } from '../api';

export function useCommitteeSittingDetails(id: string | undefined) {
    return useQuery({
        queryKey: ['committeeSittingDetails', id],
        queryFn: async () => {
            if (!id) return null;
            const sittingData = await fetchCommitteeSitting(id);

            let videoData = null;
            if (sittingData.video_url) {
                try {
                    const cleanedJson = sittingData.video_url
                        .replace(/'/g, '"')
                        .replace(/True/g, 'true')
                        .replace(/False/g, 'false');
                    videoData = JSON.parse(cleanedJson);
                } catch {
                    if (sittingData.video_url.startsWith('http')) {
                        videoData = { playerLink: sittingData.video_url };
                    }
                }
            }

            return { sitting: sittingData, videoData };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

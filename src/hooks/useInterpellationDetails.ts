import { useQuery } from '@tanstack/react-query';
import { fetchInterpellation } from '../api';

export interface Interpellation {
    id: number;
    title: string;
    sent_date: string;
    content: string;
    reply_content: string | null;
    receipt_date: string | null;
    addressee: string | null;
    topic: string | null;
}

export interface Author {
    mp_id: number;
    mps: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
        slug: string;
    };
}

export function useInterpellationDetails(id?: string) {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['interpellationDetails', id],
        queryFn: async () => {
            if (!id) return null;
            const item: any = await fetchInterpellation(id);

            const interpellation: Interpellation = {
                id: item.id,
                title: item.title,
                sent_date: item.receipt_date || item.raw_data?.receiptDate || item.sent_date || item.raw_data?.sentDate,
                content: item.content,
                reply_content: item.reply_content,
                receipt_date: item.receipt_date || null,
                addressee: item.raw_data?.to?.[0] || 'Minister',
                topic: ''
            };

            const authors: Author[] = (item.authors && Array.isArray(item.authors)) ? item.authors.map((a: any) => ({
                mp_id: a.id,
                mps: {
                    id: a.id,
                    name: `${a.first_name} ${a.last_name}`,
                    party: a.club,
                    photo_url: a.photo_url || `https://api.sejm.gov.pl/sejm/term10/MP/${a.id}/photo`,
                    slug: a.id.toString()
                }
            })) : [];

            return { interpellation, authors };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 30, // Interpellations change rarely once archived
    });

    if (error) {
        console.error('Error loading interpellation details:', error);
    }

    return {
        interpellation: data?.interpellation || null,
        authors: data?.authors || [],
        loading
    };
}

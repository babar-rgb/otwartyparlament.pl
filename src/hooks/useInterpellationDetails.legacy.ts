import { useState, useEffect } from 'react';
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
    const [interpellation, setInterpellation] = useState<Interpellation | null>(null);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                // Now using the dedicated endpoint
                const item: any = await fetchInterpellation(id);

                setInterpellation({
                    id: item.id,
                    title: item.title,
                    sent_date: item.receipt_date || item.raw_data?.receiptDate || item.sent_date || item.raw_data?.sentDate,
                    content: item.content,
                    reply_content: item.reply_content,
                    receipt_date: item.receipt_date || null,
                    addressee: item.raw_data?.to?.[0] || 'Minister', // Heuristic from raw_data
                    topic: ''
                });

                // Authors are now included in the response or we map them
                if (item.authors && Array.isArray(item.authors)) {
                    setAuthors(item.authors.map((a: any) => ({
                        mp_id: a.id,
                        mps: {
                            id: a.id,
                            name: `${a.first_name} ${a.last_name}`,
                            party: a.club,
                            photo_url: a.photo_url || `https://api.sejm.gov.pl/sejm/term10/MP/${a.id}/photo`,
                            slug: a.id.toString()
                        }
                    })));
                }
            } catch (error) {
                console.error('Error loading interpellation details:', error);
                setInterpellation(null);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    return { interpellation, authors, loading };
}

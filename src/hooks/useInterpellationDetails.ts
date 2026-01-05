import { useState, useEffect } from 'react';
import { fetchInterpellations, fetchMP } from '../api';

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
                const data = await fetchInterpellations({ limit: 100 }); // Hack to find by ID
                const item = data.find((i: any) => i.id === parseInt(id));
                if (item) {
                    setInterpellation({
                        id: item.id,
                        title: item.title,
                        sent_date: item.sent_date,
                        content: item.content,
                        reply_content: item.reply_content,
                        receipt_date: null,
                        addressee: '',
                        topic: ''
                    });

                    // Fetch Author
                    if (item.mp_id) {
                        const mp = await fetchMP(item.mp_id);
                        setAuthors([{
                            mp_id: mp.id,
                            mps: {
                                id: mp.id,
                                name: `${mp.first_name} ${mp.last_name}`,
                                party: mp.club,
                                photo_url: mp.photo_url,
                                slug: mp.slug || mp.id.toString()
                            }
                        }]);
                    }
                }
            } catch (error) {
                console.error('Error loading interpellation details:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    return { interpellation, authors, loading };
}

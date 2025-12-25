import { useState, useEffect } from 'react';
import { db } from '../lib/db';

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
                // Fetch interpellation
                const { data: interpData, error: interpError } = await db
                    .from('interpellations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (interpError) throw interpError;
                setInterpellation(interpData);

                // Fetch authors
                const { data: authorsData, error: authorsError } = await db
                    .from('interpellation_authors')
                    .select('mp_id, mps(id, name, party, photo_url, slug)')
                    .eq('interpellation_id', id);

                if (!authorsError && authorsData) {
                    setAuthors(authorsData as unknown as Author[]);
                }
            } catch (error) {
                console.error('Error loading interpellation:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    return { interpellation, authors, loading };
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SejmPrint } from '../types/domain';

const ITEMS_PER_PAGE = 100;

export function useSejmPrints() {
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [filteredPrints, setFilteredPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState(0);

    useEffect(() => {
        fetchPrints();
    }, []);

    useEffect(() => {
        filterData();
        setStartIndex(0); // Reset pagination on filter
    }, [searchTerm, filterSource, prints]);

    const fetchPrints = async () => {
        setLoading(true);
        try {
            // 1. Fetch Prints
            const { data: printsData, error: printsError } = await supabase
                .from('sejm_prints')
                .select('*')
                .limit(5000);

            if (printsError) throw printsError;

            // 2. Fetch Insights
            const { data: insightsData, error: insightsError } = await supabase
                .from('bill_insights')
                .select('print_number, ai_summary, justification_text, document_type')
                .limit(5000);

            if (insightsError) console.warn("Insights fetch error (ignoring):", insightsError);

            const insightsMap = new Map(insightsData?.map((i: any) => [i.print_number, i]));

            // 3. Merge
            const merged = (printsData || []).map((p: any) => ({
                ...p, // assumes p has fields matching SejmPrint basics
                ai_summary: insightsMap.get(p.number)?.ai_summary,
                justification_text: insightsMap.get(p.number)?.justification_text,
                document_type: insightsMap.get(p.number)?.document_type
            })) as SejmPrint[];

            // Sort by number descending (attempt to parse number)
            const sorted = merged.sort((a, b) => {
                const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
                return numB - numA;
            });

            setPrints(sorted);
        } catch (error) {
            console.error('Error fetching prints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = prints;

        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerInfo) ||
                p.number.toLowerCase().includes(lowerInfo)
            );
        }

        if (filterSource) {
            result = result.filter(p => p.title.toLowerCase().includes(filterSource.toLowerCase()));
        }

        setFilteredPrints(result);
    };

    return {
        prints,
        filteredPrints,
        loading,
        searchTerm,
        setSearchTerm,
        filterSource,
        setFilterSource,
        startIndex,
        setStartIndex,
        ITEMS_PER_PAGE
    };
}

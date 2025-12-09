
import { createClient } from '@supabase/supabase-js';
import { expandSearchQuery } from '../src/utils/searchContext';

const SUPABASE_URL = 'http://localhost:5173';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.33U98-wreuo0Qic9lsznlb9mL58v3yHJX_2vf2rcKGk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugSearch() {
    const query = "drożyzna";
    console.log(`\nOriginal Query: "${query}"`);

    const expanded = expandSearchQuery(query);
    console.log(`Expanded Terms (${expanded.length}):`, expanded.join(', '));

    if (expanded.length > 0) {
        // Replicate SearchPage.tsx logic (Step 6948)
        const semanticQuery = expanded.join(',') // Join to string logic (simulated URL passing)
            .split(',') // Split back
            .map(s => {
                const parts = s.trim().toLowerCase().split(/\s+/);
                const processedParts = parts.map(word => {
                    if (word.length > 4) return word.slice(0, -1) + ':*';
                    return word + ':*';
                });
                if (processedParts.length > 1) return `(${processedParts.join(' <-> ')})`;
                return processedParts[0];
            })
            .join(' | ');

        console.log(`\nConstructed TSQuery: "${semanticQuery}"`);

        // Execute Search
        const { data, error, count } = await supabase
            .from('processes') // Using 'processes' directly as I know it exists, or 'view_search_all' if user uses that. 
            // In SearchPage.tsx line 59: .from('view_search_all')
            // I should use view_search_all.
            .select('title', { count: 'exact' })
            .textSearch('title', semanticQuery, { config: 'simple' })
            .limit(5);

        if (error) {
            console.error("❌ DB Error:", error);
            // If view_search_all missing, fallback to processes
            console.log("Retrying with 'processes' table...");
            const { data: pData, error: pError } = await supabase
                .from('processes')
                .select('title')
                .textSearch('title', semanticQuery, { config: 'simple' })
                .limit(5);
            if (pError) console.error("❌ DB Error (processes):", pError);
            else {
                console.log(`✅ Success (processes)! Found ${pData?.length} rows.`);
                pData?.forEach(r => console.log(` - ${r.title}`));
            }

        } else {
            console.log(`✅ Success! Found ${count} rows.`);
            data.forEach(r => console.log(` - ${r.title}`));
        }
    }
}

debugSearch();

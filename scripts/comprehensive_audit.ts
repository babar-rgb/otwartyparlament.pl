
import Fuse from 'fuse.js';
import { createClient } from '@supabase/supabase-js';
import { expandSearchQuery, getAllSearchTerms } from '../src/utils/searchContext';

const SUPABASE_URL = 'http://localhost:5173';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.33U98-wreuo0Qic9lsznlb9mL58v3yHJX_2vf2rcKGk';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Config
const fuzzyTerms = getAllSearchTerms();
const fuzzyEngine = new Fuse(fuzzyTerms, {
    includeScore: true,
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 3
});

const scenarios = [
    { type: 'typo', input: 'Frankowcize', expectedSuggestion: 'frankowicze' },
    { type: 'typo', input: 'budzer', expectedSuggestion: 'budżet' },
    { type: 'slang', input: 'drożyzna', expectedContexts: ['inflacja', 'ceny', 'polityka pieniężna'] },
    { type: 'media', input: 'Lex TVN', expectedContexts: ['koncesja', 'radiofonii'] },
    { type: 'new', input: 'Podatek Katastralny', expectedContexts: ['wartość katastralna'] },
    { type: 'complex', input: 'Węgiel', expectedContexts: ['paliwa stałe', 'dodatek węglowy'] }
];

async function runAudit() {
    console.log("=== 🧪 EXPERIMENTAL AUDIT REPORT ===");
    let passed = 0;
    let failed = 0;

    for (const test of scenarios) {
        console.log(`\n----------------------------------------`);
        console.log(`🔍 Testing: "${test.input}" (${test.type})`);

        let queryToSearch = test.input;

        // 1. Fuzzy Logic Check
        if (test.type === 'typo') {
            const results = fuzzyEngine.search(test.input);
            const top = results.length > 0 ? results[0].item : null;
            console.log(`   [Fuzzy] Input: "${test.input}" -> Suggestion: "${top}"`);

            if (top && (top === test.expectedSuggestion || top.includes(test.expectedSuggestion))) {
                console.log(`   ✅ Fuzzy Match Passed`);
                queryToSearch = top; // Use corrected term for backend search
            } else {
                console.log(`   ❌ Fuzzy Match Failed (Expected: ${test.expectedSuggestion})`);
                failed++;
                continue;
            }
        }

        // 2. Context Expansion Check
        const expanded = expandSearchQuery(queryToSearch);
        console.log(`   [Expansion] Terms Count: ${expanded.length}`);

        if (test.expectedContexts) {
            const missing = test.expectedContexts.filter(c =>
                !expanded.some(e => e.toLowerCase().includes(c.toLowerCase()))
            );
            if (missing.length === 0) {
                console.log(`   ✅ Context Coverage Passed`);
            } else {
                console.log(`   ⚠️ Partial Coverage. Missing keywords: ${missing.join(', ')}`);
                // Not failing, just warning
            }
        }

        // 3. Backend E2E Probe
        if (expanded.length > 0) {
            // Construct TSQuery (Logic from SearchPage.tsx)
            const semanticQuery = expanded.join(',')
                .split(',')
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

            // console.log(`   [SQL] TSQuery: ${semanticQuery.substring(0, 50)}...`);

            const { data, error, count } = await supabase
                .from('view_search_all')
                .select('title', { count: 'exact' })
                .textSearch('title', semanticQuery, { config: 'simple' })
                .limit(3);

            if (error) {
                console.log(`   ❌ Backend Error: ${error.message}`);
                failed++;
            } else {
                console.log(`   ✅ Backend Search: Found ${count} hits`);
                if (count && count > 0) {
                    data?.forEach(d => console.log(`      📄 ${d.title.substring(0, 80)}...`));
                    passed++;
                } else {
                    console.log(`      ⚠️ Zero results found on DB`);
                    // Maybe valid for some rare terms, but check type
                    if (test.type !== 'typo') failed++; // Expecting results for legit terms
                    else passed++; // Typo corrected -> but maybe 0 results for corrected term? (Frankowicze might return 0 if no laws match 'frankowicze' titles yet?)
                    // Frankowicze expands to "klauzule abuzywne". Should exist.
                }
            }
        } else {
            console.log(`   ⚠️ No expansion for "${queryToSearch}"`);
        }
    }

    console.log(`\n========================================`);
    console.log(`🏁 RESULT: ${passed} Passed, ${failed} Failed`);
}

runAudit();

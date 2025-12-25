
import Fuse from 'fuse.js';
import { getAllSearchTerms } from '../src/utils/searchContext';

console.log("=== FUZZY SEARCH VERIFICATION V2 ===");

const terms = getAllSearchTerms();

const fuse = new Fuse(terms, {
    includeScore: true,
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 3
});

const testCases = [
    { input: "Frankowcize", expected: "frankowicze" },
    { input: "budzer", expected: "budżet" },
    { input: "drozyzna", expected: "drożyzna" },
    { input: "kpoo", expected: "kpo" }
];

testCases.forEach(({ input, expected }) => {
    const res = fuse.search(input);
    if (res.length > 0) {
        const top = res[0].item;
        const score = res[0].score;
        console.log(`Input: "${input}" -> Suggestion: "${top}" (Score: ${score?.toFixed(3)})`);

        if (top === expected || top.includes(expected)) {
            console.log("✅ PASS");
        } else {
            console.log(`❌ FAIL (Expected: ${expected})`);
        }
    } else {
        console.log(`Input: "${input}" -> NO SUGGESTION`);
        console.log(`❌ FAIL (Expected: ${expected})`);
    }
});

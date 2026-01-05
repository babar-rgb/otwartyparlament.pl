
import { expandSearchQuery, CONTEXT_MAP } from '../src/utils/searchContext';
import { EXPANDED_CONTEXT_MAP } from '../src/utils/expandedContext';
import { flattenSemanticMatrix } from '../src/utils/semanticMatrix';

async function verify() {
    console.log("=== SEMANTIC CONTEXT VERIFICATION ===");

    const matrixMap = flattenSemanticMatrix();
    const matrixKeys = Object.keys(matrixMap).length;
    console.log(`Matrix Map Keys: ${matrixKeys}`);

    const expandedKeys = Object.keys(EXPANDED_CONTEXT_MAP).length;
    console.log(`Expanded Map Keys: ${expandedKeys}`);

    // Combined unique keys
    const allKeys = new Set([
        ...Object.keys(CONTEXT_MAP),
        ...Object.keys(EXPANDED_CONTEXT_MAP),
        ...Object.keys(matrixMap)
    ]);

    console.log(`\nTOTAL UNIQUE MAPPINGS: ${allKeys.size}`);

    if (allKeys.size > 200) {
        console.log("✅ SUCCESS: Dictionary scaled > 200 terms.");
    } else {
        console.log("❌ FAIL: Target not reached.");
    }

    console.log("\n--- Functional Test ---");
    const testCases = ["KPO", "polski ład", "drożyzna", "węgiel", "800 plus", "in vitro"];

    for (const q of testCases) {
        const res = expandSearchQuery(q);
        console.log(`Query: "${q}" -> [${res.slice(0, 5).join(", ")}...] (${res.length} terms)`);
    }
}

verify();

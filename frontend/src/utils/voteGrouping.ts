export interface VoteItem {
    id: number;
    sitting?: number;
    voting_number?: number;
    date: string;
    title: string;
    topic?: string;
    kind?: string;
    title_clean?: string;
    term?: number;
    mpVote?: string;
    isFinal?: boolean;
    verdict?: string;
    for?: number;
    against?: number;
    abstained?: number;
    child_count?: number;
    is_procedural?: boolean;
    parent_vote_id?: number;
    children?: VoteItem[];
    isGroupHeader?: boolean;
    street_title?: string;
}

const PROCEDURAL_KEYWORDS = [
    "wniosek o przerwę",
    "wniosek o odroczenie",
    "wniosek o zamknięcie dyskusji",
    "wniosek o zmianę sposobu głosowania",
    "wniosek o uzupełnienie porządku",
    "rekapitulacja",
    "stwierdzenie kworum"
];

const FINALITY_KEYWORDS = [
    "nad całością projektu",
    "uchwalenie projektu",
    "przyjęcie projektu",
    "odrzucenie projektu",
    "udzielenie wotum",
    "powołanie",
    "wybór",
    "odwołanie"
];

export function extractPrintNumber(title: string): string | null {
    const match = title.match(/druki? n?r (\d+)/i);
    return match ? match[1] : null;
}

export function isProcedural(title: string): boolean {
    const t = title.toLowerCase();
    return PROCEDURAL_KEYWORDS.some(k => t.includes(k));
}

export function isFinal(title: string): boolean {
    const t = title.toLowerCase();
    return FINALITY_KEYWORDS.some(k => t.includes(k));
}

export function groupVotesGlobally(votes: VoteItem[]): VoteItem[] {
    if (votes.length === 0) return [];

    const groupedMap: Record<string, { main?: VoteItem, children: VoteItem[], procedural: VoteItem[] }> = {};
    const standaloneVotes: VoteItem[] = [];

    votes.forEach(vote => {
        const printNum = extractPrintNumber(vote.title);
        const procedural = isProcedural(vote.title);

        if (printNum) {
            if (!groupedMap[printNum]) {
                groupedMap[printNum] = { children: [], procedural: [] };
            }

            if (procedural) {
                groupedMap[printNum].procedural.push(vote);
            } else if (isFinal(vote.title)) {
                // If multiple "finals" exist (rare), we keep the one with higher voting number
                if (!groupedMap[printNum].main || (vote.voting_number || 0) > (groupedMap[printNum].main!.voting_number || 0)) {
                    if (groupedMap[printNum].main) groupedMap[printNum].children.push(groupedMap[printNum].main!);
                    groupedMap[printNum].main = vote;
                } else {
                    groupedMap[printNum].children.push(vote);
                }
            } else {
                groupedMap[printNum].children.push(vote);
            }
        } else if (procedural) {
            // General procedural votes not linked to a specific bill
            standaloneVotes.push({ ...vote, is_procedural: true });
        } else {
            standaloneVotes.push(vote);
        }
    });

    const result: VoteItem[] = [];

    // Process grouped bills
    Object.keys(groupedMap).forEach(key => {
        const group = groupedMap[key];
        if (group.main) {
            const children = [...group.children].sort((a, b) => (b.voting_number || 0) - (a.voting_number || 0));
            result.push({
                ...group.main,
                isGroupHeader: children.length > 0,
                children: children,
                // We could also attach procedural here if we wanted them nested
            });
            // Add procedural as separate entries if they are just "formal requests" but related?
            // User says: "Ukryte / Filtrowalne: Wnioski formalne". We keep them in standalone for now
            // and let the filter handle them.
        } else if (group.children.length > 0) {
            // No clear "main" vote found, use the latest child as header
            const sorted = [...group.children].sort((a, b) => (b.voting_number || 0) - (a.voting_number || 0));
            const head = sorted[0];
            const tail = sorted.slice(1);
            result.push({
                ...head,
                isGroupHeader: tail.length > 0,
                children: tail
            });
        }

        // Add related procedural
        group.procedural.forEach(p => result.push({ ...p, is_procedural: true }));
    });

    // Add standalone
    result.push(...standaloneVotes);

    // Sort result by date and voting number descending
    return result.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.voting_number || 0) - (a.voting_number || 0);
    });
}

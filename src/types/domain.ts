export interface MP {
    id: number;
    first_name: string;
    last_name: string;
    club: string;
    district: string;
    photo_url: string;
    active: boolean;
    // District details
    districtNum?: number;
    districtName?: string;
    voivodeship?: string;
    // Contact
    email?: string;
    // UI helpers
    votesCount?: number;
    billsCount?: number; // legacy?
    attendanceRate?: number;
    aktywnosc?: number;
    rebelVotes?: number;
    seat_number?: number | null;
    slug?: string;
    term?: number;
    declarations?: { label: string; url: string }[];
    contact_info?: {
        twitter?: string;
        facebook?: string;
        instagram?: string;
        website?: string;
        offices?: { address: string; phone?: string }[];
    };
    // Biography
    biography?: string;
    birth_date?: string;
    birth_location?: string;
    profession?: string;
    education_level?: string;
    education_history?: string[]; // JSON array of strings from API
    stats?: {
        speeches?: number;
        interpellations?: number;
        bills?: number;
        activity_score?: number;
        voteParticipation?: number;
    };
};

export interface Vote {
    id: number;
    date: string;
    title: string;
    description?: string;
    topic?: string;
    importance?: number;
    kind?: string;
    result?: string;
    categoryIcon?: string;
    for?: number;
    against?: number;
    abstained?: number;
    absent?: number;

    // Supabase specific fields usually found in joins
    sitting?: number;
    voting_number?: number;
    title_clean?: string;
    title_raw?: string;
    verdict?: string;
    term?: number;

    // SEO Data (Added Jan 2026)
    street_title?: string;
    meta_description?: string;
    seo_keywords?: string[];

    // AI Enrichment (Stage 11)
    ai_summary?: string;
    ai_tags?: string[];

    // Grouping
    parent_vote_id?: number;
    children?: Vote[];
    isGroupHeader?: boolean;
}

export interface GroupedVote extends Vote {
    children: Vote[];
    isGroupHeader: boolean;
}



export interface Speech {
    id: number;
    mp_id: number | null;
    sitting: number;
    date: string;
    speaker_name: string;
    content: string;
    topic: string;
    mp?: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
    };
}

export interface SejmPrint {
    id?: number;
    number: string;
    title: string;
    summary: string | null;
    process_id: string | null;
    ai_summary?: string;
    pros?: string[];
    cons?: string[];
    justification_text?: string;
    document_type?: string;
    type?: string;
    term?: number;
}



export interface EuroVote {
    id: string;
    title: string;
    date: string;
    votes_for: number;
    votes_against: number;
    votes_abstain: number;
    importance_score: number;
    is_key_vote: boolean;
    term: number;
    topic_tag?: string;
}

export interface EuroMEP {
    id: string;
    api_id: number;
    name: string;
    party: string;
    country: string;
    photo_url?: string;
    term: number;
}

export interface Interpellation {
    id: number;
    term: number;
    title: string;
    sent_date: string;
    last_modified?: string;
    content?: string;
    reply_content?: string;
    raw_data?: {
        content?: string;
        key?: string;
        num?: number;
        from?: string[] | string;
        to?: string[];
        [key: string]: any;
    };
    // Support both potential API structures: explicit join or flat object
    authors?: Array<{
        mp_id?: number;
        mp?: MP;
        first_name?: string;
        last_name?: string;
        photo_url?: string;
    }>;
}

export interface Committee {
    id: number;
    name: string;
    code: string;
    description?: string;
    phone?: string;
    members?: { mp_id: number; role: string; mp?: MP }[];
}

export interface VoteHistoryItem {
    vote: 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT';
    votes: Vote;
    isFinal?: boolean;
}

export interface VoteAnalysis {
    vote_id: number;
    summary: string;
    summary_expert?: string;
    pros: string[];
    cons: string[];
    procedural_context?: string;
}

// Party type for strict typing
export type PartyCode = 'PiS' | 'KO' | 'Polska2050' | 'PSL-TD' | 'Lewica' | 'Konfederacja' | 'Razem' | 'Kukiz15' | 'Niezrzeszeni';

export interface MPStat {
    key: string;
    value: any; // JSON parsed
    label?: string;
    description?: string;
}

export interface MPRelation {
    id: number;
    mp_id_a: number;
    mp_id_b: number;
    similarity_score: number;
    relation_type: string;
    mp_target?: MP;
}

export type SearchResultType = 'mp' | 'vote' | 'process' | 'speech' | 'interpellation';

export interface SearchResult {
    type: SearchResultType;
    id: string;
    title: string;
    date?: string;
    term?: number;

    // MP specific
    data?: Partial<MP>; // The backend sends a dictionary of MP fields

    // Vote specific
    topic?: string;
    ux_category?: string;
    sitting?: number;
    voting_number?: number;
    ai_summary?: string;
    ai_tags?: string[];

    // Speech specific
    content_preview?: string;
    mp_id?: string;
}

export interface RankingEntry extends MP {
    rank: number;
    value: number;
    unit: string;
}

export interface EuroVoteResult {
    vote: 'For' | 'Against' | 'Abstain' | 'Absent';
    mep?: {
        id: string;
        name: string; // generic name
        full_name: string; // Used in EuroVoteDetails
        national_party?: string;
        eu_group?: string;
        country?: string;
    };
}

export interface AssetDeclaration {
    id: number;
    year: string;
    pdf_url: string;
    file_path: string;
    parsed_content?: {
        income?: number;
        savings?: number;
        currency?: string;
    };
    summary?: string;
}

export interface TopPriority {
    topic: string;
    count: number;
}

export interface MPStatsExtended {
    badges?: string[];
    top_priorities?: TopPriority[];
    activity_score?: number;
    function_gov?: string;
}

export interface Category {
    id: number;
    name_pl: string;
    name_citizen: string;
    vote_count: number;
    ux_category?: string;
    level: number;
    children?: Category[];
}



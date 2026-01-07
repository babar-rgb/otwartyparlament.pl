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
    birth_date?: string;
    birth_location?: string;
    profession?: string;
    education_level?: string;
    education_history?: string[]; // JSON array of strings from API
    stats?: {
        speeches?: number;
        interpellations?: number;
        voteParticipation?: number;
    };
}

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
    number: string;
    title: string;
    summary: string | null;
    process_id: string | null;
    ai_summary?: string;
    justification_text?: string;
    document_type?: string;
}

export interface RankingMP {
    id: number;
    first_name: string;
    last_name: string;
    club: string;
    district: string;
    photo_url: string;
    stats_attendance: number;
    stats_rebellion: number;
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
    title: string;
    sent_date: string;
    last_modified?: string;
    raw_data?: Record<string, unknown>;
    authors?: { mp_id: number; mp?: MP }[];
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
    pros: string[];
    cons: string[];
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

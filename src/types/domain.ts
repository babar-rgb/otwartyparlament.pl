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

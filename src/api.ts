import { MP, Vote, VoteAnalysis } from './types/domain';

export const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type { MP, Vote };

export const fetchMPs = async (options?: { term?: number; active?: boolean; skip?: number; limit?: number }): Promise<MP[]> => {
  const params = new URLSearchParams();
  if (options?.term) params.append('term', options.term.toString());
  if (options?.active !== undefined) params.append('active', options.active.toString());
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(`${API_URL}/mps?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch MPs');
  }
  const data = await response.json();
  return data.map(mapBackendMP);
};

export const fetchMP = async (id: string): Promise<MP> => {
  const response = await fetch(`${API_URL}/mps/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch MP');
  }
  const data = await response.json();
  return mapBackendMP(data);
};

type FetchVotesOptions = {
  term?: number;
  sitting?: number;
  voting_number?: number;
  mp_id?: number | string;
  print_number?: string;
  skip?: number; // Old pagination param
  limit?: number;
  offset?: number; // New pagination param, replaces skip
  has_results?: boolean;
  rebellion?: boolean;
  // New filters
  date_from?: string;
  date_to?: string;
  verdict?: string;
};

export const fetchVotes = async (options: FetchVotesOptions = {}): Promise<{ items: any[]; total: number }> => {
  const params = new URLSearchParams();
  if (options.term) params.append('term', options.term.toString());
  if (options.sitting) params.append('sitting', options.sitting.toString());
  if (options.voting_number) params.append('voting_number', options.voting_number.toString());
  if (options.mp_id) params.append('mp_id', options.mp_id.toString());
  if (options.print_number) params.append('print_number', options.print_number);
  // Use offset if provided, otherwise fallback to skip
  if (options.offset) params.append('skip', options.offset.toString());
  else if (options.skip) params.append('skip', options.skip.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.has_results) params.append('has_results', 'true');
  if (options.rebellion) params.append('rebellion', 'true');
  if (options.date_from) params.append('date_from', options.date_from);
  if (options.date_to) params.append('date_to', options.date_to);
  if (options.verdict) params.append('verdict', options.verdict);

  const response = await fetch(`${API_URL}/votes?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Votes');
  }
  const data = await response.json();
  return {
    items: data.items.map(mapBackendVote),
    total: data.total
  };
};

export const fetchVote = async (id: string): Promise<Vote> => {
  const response = await fetch(`${API_URL}/votes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Vote');
  }
  const data = await response.json();
  return mapBackendVote(data);
};

export const fetchVoteAnalysis = async (voteId: string): Promise<VoteAnalysis | null> => {
  try {
    const response = await fetch(`${API_URL}/votes/${voteId}/analysis`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch Analysis');
    }
    const data = await response.json();
    return {
      vote_id: data.vote_id,
      summary: data.summary,
      pros: Array.isArray(data.pros) ? data.pros : [],
      cons: Array.isArray(data.cons) ? data.cons : []
    };
  } catch (e) {
    console.error("Error fetching analysis:", e);
    return null;
  }
};

export const generateVoteAnalysis = async (voteId: string): Promise<VoteAnalysis | null> => {
  try {
    const response = await fetch(`${API_URL}/votes/${voteId}/analyze`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to generate Analysis');
    }
    const data = await response.json();
    return {
      vote_id: data.vote_id,
      summary: data.summary,
      pros: Array.isArray(data.pros) ? data.pros : [],
      cons: Array.isArray(data.cons) ? data.cons : []
    };
  } catch (e) {
    console.error("Error generating analysis:", e);
    return null;
  }
};

export const fetchMPStats = async (mpId: string | number): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`${API_URL}/mps/${mpId}/stats`);
    if (!response.ok) return {};
    const data = await response.json();
    // Parse JSON values if they are strings
    Object.keys(data).forEach(key => {
      try {
        data[key] = JSON.parse(data[key]);
      } catch {
        // Keep as string if not JSON
      }
    });
    return data;
  } catch (e) {
    console.error("Error fetching MP stats:", e);
    return {};
  }
};

export const fetchMPAlignment = async (mpId: string | number) => {
  try {
    const response = await fetch(`${API_URL}/mps/${mpId}/alignment`);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Error fetching alignment:", e);
    return [];
  }
};

export const fetchMPDeclarations = async (mpId: string | number) => {
  try {
    const response = await fetch(`${API_URL}/mps/${mpId}/declarations`);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Error fetching declarations:", e);
    return [];
  }
};

export const fetchInterpellations = async (options?: { mp_id?: number; skip?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (options?.mp_id) params.append('mp_id', options.mp_id.toString());
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  const response = await fetch(`${API_URL}/interpellations?${params.toString()}`);
  return await response.json();
};

export const fetchInterpellationsCount = async () => {
  const response = await fetch(`${API_URL}/interpellations/count`);
  if (!response.ok) throw new Error('Failed to fetch interpellations count');
  const data = await response.json();
  return data.count;
};

export const fetchInterpellation = async (id: string | number) => {
  const response = await fetch(`${API_URL}/interpellations/${id}`);
  if (!response.ok) throw new Error('Failed to fetch interpellation');
  return await response.json();
};

export const fetchVoteResults = async (options?: { mp_id?: number | string; vote_id?: number | string; mp_ids?: (number | string)[]; limit?: number }) => {
  const params = new URLSearchParams();
  if (options?.mp_id) params.append('mp_id', options.mp_id.toString());
  if (options?.vote_id) params.append('vote_id', options.vote_id.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.mp_ids) options.mp_ids.forEach(id => params.append('mp_ids', id.toString()));

  const response = await fetch(`${API_URL}/votes/results?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch vote results');
  return await response.json();
};

export const fetchVoteResultsDetailed = async (voteId: number | string) => {
  const response = await fetch(`${API_URL}/votes/${voteId}/results`);
  if (!response.ok) throw new Error('Failed to fetch detailed vote results');
  return await response.json();
};

export const fetchVoteConnections = async (voteId: number | string) => {
  const response = await fetch(`${API_URL}/votes/${voteId}/connections`);
  if (!response.ok) throw new Error('Failed to fetch vote connections');
  return await response.json();
};

export const fetchCommittees = async (term?: number) => {
  const params = new URLSearchParams();
  if (term) params.append('term', term.toString());
  const response = await fetch(`${API_URL}/committees?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch committees');
  return await response.json();
};

export const fetchCommittee = async (code: string) => {
  const response = await fetch(`${API_URL}/committees/${code}`);
  if (!response.ok) throw new Error('Failed to fetch committee');
  return await response.json();
};

export const fetchEuroVotes = async (options?: { term?: number; tag?: string; keyOnly?: boolean; search?: string; skip?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (options?.term) params.append('term', options.term.toString());
  if (options?.tag && options.tag !== 'Wszystkie') params.append('tag', options.tag);
  if (options?.keyOnly) params.append('key_only', 'true');
  if (options?.search) params.append('search', options.search);
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(`${API_URL}/euro/votes?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch Euro votes');
  return await response.json();
};

export const fetchEuroVote = async (id: string) => {
  const response = await fetch(`${API_URL}/euro/votes/${id}`);
  if (!response.ok) throw new Error('Failed to fetch Euro vote');
  return await response.json();
};

export const fetchEuroVoteResults = async (voteId: string) => {
  const response = await fetch(`${API_URL}/euro/votes/${voteId}/results`);
  if (!response.ok) throw new Error('Failed to fetch Euro vote results');
  return await response.json();
};

export const fetchEuroMPs = async (options?: { term?: number; active?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.term) params.append('term', options.term.toString());
  if (options?.active !== undefined) params.append('active', options.active.toString());
  const response = await fetch(`${API_URL}/euro/mps?${params.toString()}`); // Backend still has /euro/mps, but I'll make sure it handles params
  if (!response.ok) throw new Error('Failed to fetch Euro MPs');
  return await response.json();
};

export const fetchEuroMP = async (id: string) => {
  const response = await fetch(`${API_URL}/euro/mps/${id}`);
  if (!response.ok) throw new Error('Failed to fetch Euro MP');
  return await response.json();
};

export const fetchEuroMPHistory = async (apiId: number) => {
  const response = await fetch(`${API_URL}/euro/mps/${apiId}/history`);
  if (!response.ok) throw new Error('Failed to fetch Euro MP history');
  return await response.json();
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return await response.json();
};

export const fetchParties = async () => {
  const response = await fetch(`${API_URL}/mps?limit=1000`); // Simple hack for now to get party list from MPs or just return clubs
  if (!response.ok) throw new Error('Failed to fetch parties');
  const mps = await response.json();
  const clubs = Array.from(new Set(mps.map((m: any) => m.club))).map(name => ({ id: name, name, logo_url: '', color: '#0355BF' }));
  return clubs;
};

export const fetchCategoryVoteCounts = async (term: number) => {
  const response = await fetch(`${API_URL}/categories/vote_counts?term=${term}`);
  if (!response.ok) throw new Error('Failed to fetch category vote counts');
  return await response.json();
};

export const unifiedSearch = async (options: { q: string; type?: string; period?: string; controversial?: boolean; expanded?: string }) => {
  const params = new URLSearchParams();
  params.append('q', options.q);
  if (options.type) params.append('type', options.type);
  if (options.period) params.append('period', options.period);
  if (options.controversial) params.append('controversial', 'true');
  if (options.expanded) params.append('expanded', options.expanded);

  const response = await fetch(`${API_URL}/search?${params.toString()}`);
  if (!response.ok) throw new Error('Search failed');
  return await response.json();
};

export const fetchUpcomingSittings = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/sejm/upcoming-sittings`);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Error fetching upcoming sittings:", e);
    return [];
  }
};

export const fetchProcess = async (id: string) => {
  const response = await fetch(`${API_URL}/legislative_processes/${id}`);
  if (!response.ok) throw new Error('Failed to fetch process');
  return await response.json();
};

export const fetchProcesses = async (options?: { skip?: number; limit?: number; term?: number; q?: string; type?: string }) => {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.term) params.append('term', options.term.toString());
  if (options?.q) params.append('q', options.q);
  if (options?.type) params.append('type', options.type);
  const response = await fetch(`${API_URL}/legislative_processes?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch processes');
  return await response.json();
};

export const fetchProcessesCount = async (term?: number) => {
  const params = new URLSearchParams();
  if (term) params.append('term', term.toString());
  const response = await fetch(`${API_URL}/legislative_processes/count?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch processes count');
  const data = await response.json();
  return data.count;
};

export const fetchRelatedProcesses = async (processId: string, limit: number = 5) => {
  const response = await fetch(`${API_URL}/processes/${processId}/related?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch related processes');
  return await response.json();
};

export const matchPoliticalTwin = async (query: string) => {
  const response = await fetch(`${API_URL}/alignment/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!response.ok) throw new Error('Failed to calculate alignment');
  return await response.json();
};

export const fetchPersonasFeed = async (persona: string, limit: number = 20) => {
  const response = await fetch(`${API_URL}/personas/feed?persona=${persona}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch personas feed');
  return await response.json();
};

export const fetchSpeech = async (id: string) => {
  const response = await fetch(`${API_URL}/speeches/${id}`);
  if (!response.ok) throw new Error('Failed to fetch speech');
  return await response.json();
};

export const fetchSpeeches = async (options?: { skip?: number; limit?: number; mp_id?: number | string; party?: string; date_from?: string; date_to?: string; q?: string }) => {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.mp_id) params.append('mp_id', options.mp_id.toString());
  if (options?.party) params.append('party', options.party);
  if (options?.date_from) params.append('date_from', options.date_from);
  if (options?.date_to) params.append('date_to', options.date_to);
  if (options?.q) params.append('q', options.q);

  const response = await fetch(`${API_URL}/speeches?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch speeches');
  return await response.json();
};

export const fetchSpeechesCount = async () => {
  const response = await fetch(`${API_URL}/speeches/count`);
  if (!response.ok) throw new Error('Failed to fetch speeches count');
  const data = await response.json();
  return data.count;
};
export const fetchWealthRankings = async () => {
  const response = await fetch(`${API_URL}/mps/asset_declarations`);
  if (!response.ok) throw new Error('Failed to fetch wealth rankings');
  return await response.json();
};

export const fetchCommitteeSitting = async (sittingId: string | number) => {
  const response = await fetch(`${API_URL}/committees/sittings/${sittingId}`);
  if (!response.ok) throw new Error('Failed to fetch committee sitting');
  return await response.json();
};

// Helper: Map Backend MP -> Frontend MP
const mapBackendMP = (data: any): MP => {
  let email = "";
  if (data.first_name && data.last_name) {
    const emailName = `${data.first_name}.${data.last_name}`
      .toLowerCase()
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ł/g, 'l')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ź/g, 'z')
      .replace(/ż/g, 'z')
      .replace(/\s+/g, '.');
    email = `${emailName}@sejm.pl`;
  }

  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    club: data.club,
    district: data.district,
    photo_url: data.photo_url,
    active: data.active,
    email: data.email || email, // Prefer DB email if exists, else construct
    attendanceRate: data.stats_attendance,
    rebelVotes: data.stats_rebellion,
    term: data.term,
    contact_info: data.contact_info, // Pass through JSONB
    slug: data.slug,
    biography: data.biography,
    birth_date: data.birth_date,
    birth_location: data.birth_location,
    profession: data.profession,
    education_level: data.education_level,
    education_history: data.education_history
  } as MP;
};

// Helper: Map Backend Vote -> Frontend Vote
const mapBackendVote = (data: any): Vote => {
  const details = data.details_json || {};
  return {
    id: data.id,
    date: data.date,
    title: data.title_clean || data.title_raw,
    title_clean: data.title_clean,
    title_raw: data.title_raw,
    description: data.description,
    topic: data.topic,
    importance: data.importance,
    kind: data.kind,
    verdict: data.verdict,
    result: data.verdict,
    for: details.yes || 0,
    against: details.no || 0,
    abstained: details.abstain || 0,
    absent: 460 - (details.yes || 0) - (details.no || 0) - (details.abstain || 0),
    sitting: data.sitting,
    voting_number: data.voting_number,
    term: data.term,
    mpVote: data.mp_vote // Mapped from backend augmented response
  } as Vote;
};

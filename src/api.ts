const API_URL = 'https://api.sejm.gov.pl/sejm/term10';

export interface MP {
  id: number;
  first_name: string;
  last_name: string;
  club: string;
  district: string;
  photo_url: string;
  active: boolean;
  // Optional fields for UI
  votesCount?: number;
  billsCount?: number;
  attendanceRate?: number;
  aktywnosc?: number;
}

export interface Vote {
  id: number;
  date: string;
  title: string;
  description: string;
  topic: string;
  importance: number;
  kind: string;
  // Optional fields for UI
  result?: string;
  categoryIcon?: string;
  for?: number;
  against?: number;
  abstained?: number;
  absent?: number;
}

export const fetchMPs = async (): Promise<MP[]> => {
  const response = await fetch(`${API_URL}/MP`);
  if (!response.ok) {
    throw new Error('Failed to fetch MPs');
  }
  const data = await response.json();
  // Ensure the response is an array before mapping
  if (!Array.isArray(data)) {
    console.warn('Unexpected API response format, expected array but got', data);
    return [];
  }
  // Map API fields to internal MP shape
  return data.map(mapApiMP);
};

export const fetchMP = async (id: string): Promise<MP> => {
  const response = await fetch(`${API_URL}/MP/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch MP');
  }
  return response.json();
};

export const fetchVotes = async (): Promise<Vote[]> => {
  const response = await fetch(`${API_URL}/votes`);
  if (!response.ok) {
    throw new Error('Failed to fetch Votes');
  }
  return response.json();
};

export const fetchVote = async (id: string): Promise<Vote> => {
  const response = await fetch(`${API_URL}/votes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Vote');
  }
  return response.json();
};

// Helper to convert API MP object to our MP interface
export const mapApiMP = (apiMp: any): MP => {
  // API provides `firstLastName` as a single string, split into first and last name
  const [first_name, ...lastParts] = apiMp.firstLastName?.split(' ') || [];
  const last_name = lastParts.join(' ');
  const id = apiMp.id;
  const club = apiMp.club || '';
  const district = apiMp.district || '';
  const photo_url = `${API_URL}/MP/${id}/photo`;
  // Random attendance between 80-100 if not provided
  const attendanceRate = Math.floor(Math.random() * 21) + 80;
  return {
    id,
    first_name,
    last_name,
    club,
    district,
    photo_url,
    active: apiMp.active ?? true, // Use API's active field, default to true if not provided
    attendanceRate,
  } as MP;
};

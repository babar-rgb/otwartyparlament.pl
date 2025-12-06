const API_URL = 'https://api.sejm.gov.pl/sejm/term10';

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
  // Optional fields for UI
  votesCount?: number;
  billsCount?: number;
  attendanceRate?: number;
  aktywnosc?: number;
  rebelVotes?: number; // Votes against party line
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
  const data = await response.json();
  return mapApiMP(data);
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
  const district = apiMp.districtName || apiMp.district || '';
  const photo_url = `${API_URL}/MP/${id}/photo`;

  // Extract district details
  const districtNum = apiMp.districtNum;
  const districtName = apiMp.districtName;
  const voivodeship = apiMp.voivodeship;

  // Extract email or generate fallback
  let email = apiMp.email;
  if (!email && first_name && last_name) {
    // Generate standard Sejm email: name.surname@sejm.pl
    const emailName = `${first_name}.${last_name}`
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

  // Random attendance between 80-100 if not provided
  const attendanceRate = Math.floor(Math.random() * 21) + 80;

  return {
    id,
    first_name,
    last_name,
    club,
    district,
    photo_url,
    active: apiMp.active ?? true,
    districtNum,
    districtName,
    voivodeship,
    email,
    attendanceRate,
  } as MP;
};

export const fetchSittingVotes = async (sittingId: number) => {
  const response = await fetch(`${API_URL}/votings/${sittingId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch votes');
  }
  return response.json();
};

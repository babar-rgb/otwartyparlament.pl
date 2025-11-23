const API_URL = 'http://localhost:8000';

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
  const response = await fetch(`${API_URL}/mps`);
  if (!response.ok) {
    throw new Error('Failed to fetch MPs');
  }
  return response.json();
};

export const fetchMP = async (id: string): Promise<MP> => {
  const response = await fetch(`${API_URL}/mps/${id}`);
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

export interface MP {
  id: string;
  imie: string;
  nazwisko: string;
  party: string;
  district: string;
  photoUrl: string;
  aktywnosc: number;
  votesCount: number;
  billsCount: number;
  interpellationsCount: number;
  attendanceRate: number;
  partyAlignment: number;
}

export interface Vote {
  id: string;
  number: number;
  date: string;
  title: string;
  description: string;
  result: 'przyjęto' | 'odrzucono';
  for: number;
  against: number;
  abstained: number;
  absent: number;
  importance: number;
  category: string;
  categoryIcon: string;
  type: 'ustawa' | 'uchwała' | 'apelacja';
}

export interface VoteResult {
  id: string;
  voteId: string;
  mpId: string;
  vote: 'za' | 'przeciw' | 'wstrzymał się' | 'nieobecny';
}

export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl: string;
  mpCount: number;
  cohesion: number;
  activity: number;
}

export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  votesCount: number;
}

export interface RankingEntry {
  rank: number;
  mpName: string;
  party: string;
  partyColor: string;
  value: number;
  unit: string;
}

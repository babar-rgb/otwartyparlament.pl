import { useQuery } from '@tanstack/react-query';
import { fetchMPs, fetchProcesses } from '../api';

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

export interface LegStat {
    label: string;
    count: number;
    color: string;
    accent: string;
}

export function useRankings() {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['rankings'],
        queryFn: async () => {
            const [mpRawData, processesRes] = await Promise.all([
                fetchMPs({ active: true, limit: 500 }),
                fetchProcesses({ limit: 100 })
            ]);

            const mps: RankingMP[] = mpRawData.map((m: any) => ({
                id: m.id,
                first_name: m.first_name,
                last_name: m.last_name,
                club: m.club,
                district: m.district,
                photo_url: m.photo_url,
                stats_attendance: m.attendanceRate || 0,
                stats_rebellion: m.rebelVotes || 0
            }));

            const processes = processesRes.items;
            let gov = 0, mp = 0, senate = 0, citizen = 0, comm = 0, prez = 0;
            processes.forEach((p: any) => {
                const t = (p.title || '').toLowerCase();
                if (t.includes('rządowy')) gov++;
                else if (t.includes('poselski')) mp++;
                else if (t.includes('senacki')) senate++;
                else if (t.includes('obywatelski')) citizen++;
                else if (t.includes('komisyjny')) comm++;
                else if (t.includes('prezydent')) prez++;
            });

            const legStats: LegStat[] = [
                { label: 'Rządowe', count: gov, color: 'bg-blue-500', accent: 'text-blue-400' },
                { label: 'Poselskie', count: mp, color: 'bg-emerald-500', accent: 'text-emerald-400' },
                { label: 'Senackie', count: senate, color: 'bg-amber-500', accent: 'text-amber-400' },
                { label: 'Komisyjne', count: comm, color: 'bg-slate-400', accent: 'text-slate-300' },
                { label: 'Obywatelskie', count: citizen, color: 'bg-cyan-500', accent: 'text-cyan-400' },
                { label: 'Prezydenckie', count: prez, color: 'bg-rose-500', accent: 'text-rose-400' },
            ].sort((a, b) => b.count - a.count);

            return { mps, legStats };
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    if (error) {
        console.error('Error in useRankings:', error);
    }

    return {
        mps: data?.mps || [],
        legStats: data?.legStats || [],
        loading
    };
}

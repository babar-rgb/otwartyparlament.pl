import { useState, useEffect } from 'react';
import { db } from '../lib/db';

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
    const [mps, setMps] = useState<RankingMP[]>([]);
    const [legStats, setLegStats] = useState<LegStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data, error } = await db
                    .from('mps')
                    .select('id, first_name, last_name, club, district, photo_url, stats_attendance, stats_rebellion')
                    .eq('active', true);

                if (error) throw error;

                const mappedMps = data.map((mp: any) => ({
                    id: mp.id,
                    first_name: mp.first_name,
                    last_name: mp.last_name,
                    club: mp.club,
                    district: mp.district,
                    photo_url: mp.photo_url,
                    stats_attendance: mp.stats_attendance || 0,
                    stats_rebellion: mp.stats_rebellion || 0,
                }));

                setMps(mappedMps);

                const { data: printsData } = await db.from('bills').select('title');

                if (printsData) {
                    let gov = 0, mp = 0, senate = 0, citizen = 0, comm = 0, prez = 0;
                    printsData.forEach((p: any) => {
                        const t = p.title.toLowerCase();
                        if (t.includes('rządowy')) gov++;
                        else if (t.includes('poselski')) mp++;
                        else if (t.includes('senacki')) senate++;
                        else if (t.includes('obywatelski')) citizen++;
                        else if (t.includes('komisyjny')) comm++;
                        else if (t.includes('prezydent')) prez++;
                    });

                    setLegStats([
                        { label: 'Rządowe', count: gov, color: 'bg-blue-500', accent: 'text-blue-400' },
                        { label: 'Poselskie', count: mp, color: 'bg-emerald-500', accent: 'text-emerald-400' },
                        { label: 'Senackie', count: senate, color: 'bg-amber-500', accent: 'text-amber-400' },
                        { label: 'Komisyjne', count: comm, color: 'bg-slate-400', accent: 'text-slate-300' },
                        { label: 'Obywatelskie', count: citizen, color: 'bg-cyan-500', accent: 'text-cyan-400' },
                        { label: 'Prezydenckie', count: prez, color: 'bg-rose-500', accent: 'text-rose-400' },
                    ].sort((a, b) => b.count - a.count));
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return { mps, legStats, loading };
}

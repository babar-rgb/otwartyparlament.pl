import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { Calendar, ArrowRight, Clock } from 'lucide-react';

interface UpcomingSession {
    sitting_number: number;
    date: string;
    item_count: number;
}

export default function UpcomingVotesWidget() {
    const [sessions, setSessions] = useState<UpcomingSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUpcoming = async () => {
            try {
                // Get future sessions from sitting_agendas
                const today = new Date().toISOString().split('T')[0];

                const { data, error } = await db
                    .from('sitting_agendas')
                    .select('sitting_number, date')
                    .gte('date', today)
                    .order('date', { ascending: true });

                if (!error && data) {
                    // Group by sitting and count items
                    const grouped: Record<number, { date: string; count: number }> = {};
                    for (const item of data) {
                        if (!grouped[item.sitting_number]) {
                            grouped[item.sitting_number] = { date: item.date, count: 0 };
                        }
                        grouped[item.sitting_number].count++;
                    }

                    const sessions = Object.entries(grouped).map(([num, info]) => ({
                        sitting_number: parseInt(num),
                        date: info.date,
                        item_count: info.count,
                    }));

                    setSessions(sessions.slice(0, 3)); // Top 3 upcoming
                }
            } catch (error) {
                console.error('Error loading upcoming votes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUpcoming();
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-blue-100 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-blue-100 rounded"></div>
                    <div className="h-16 bg-blue-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return null;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        };
        return date.toLocaleDateString('pl-PL', options);
    };

    const getDaysUntil = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Dziś';
        if (diff === 1) return 'Jutro';
        return `Za ${diff} dni`;
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Nadchodzące Głosowania
                </h3>
                <Link
                    to="/glosowania"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    Wszystkie <ArrowRight size={14} />
                </Link>
            </div>

            <div className="space-y-3">
                {sessions.map((session) => (
                    <Link
                        key={session.sitting_number}
                        to={`/glosowania?sitting=${session.sitting_number}`}
                        className="block p-4 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                    Posiedzenie {session.sitting_number}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                                    <Clock size={14} />
                                    {formatDate(session.date)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                                    {getDaysUntil(session.date)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {session.item_count.toLocaleString()} punktów
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {sessions.length > 0 && (
                <div className="mt-4 text-center">
                    <span className="text-xs text-slate-500">
                        Zobacz co będzie głosowane w Sejmie
                    </span>
                </div>
            )}
        </div>
    );
}

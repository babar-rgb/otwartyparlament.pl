import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import { ArrowLeft, Calendar, MapPin, Video, Clock, FileText, Users, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';

interface CommitteeSitting {
    id: number;
    committee_code: string;
    sitting_number: number;
    date: string;
    start_time: string;
    end_time: string;
    room: string;
    status: string;
    is_remote: boolean;
    is_closed: boolean;
    video_url: string;
    agenda: any;
}

interface Committee {
    code: string;
    name: string;
}

export default function CommitteeSittingDetails() {
    const { committeeCode, sittingId } = useParams();
    const [sitting, setSitting] = useState<CommitteeSitting | null>(null);
    const [committee, setCommittee] = useState<Committee | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoData, setVideoData] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!committeeCode || !sittingId) return;

            try {
                // Fetch sitting details
                const { data: sittingData, error } = await db
                    .from('committee_sittings')
                    .select('*')
                    .eq('id', sittingId)
                    .single();

                if (error) throw error;
                setSitting(sittingData);

                // Parse video data if exists
                if (sittingData.video_url) {
                    try {
                        // video_url might be a JSON string with quotes issues
                        const cleanedJson = sittingData.video_url
                            .replace(/'/g, '"')
                            .replace(/True/g, 'true')
                            .replace(/False/g, 'false');
                        const parsed = JSON.parse(cleanedJson);
                        setVideoData(parsed);
                    } catch {
                        // Fallback: it might be a direct URL
                        if (sittingData.video_url.startsWith('http')) {
                            setVideoData({ playerLink: sittingData.video_url });
                        }
                    }
                }

                // Fetch committee info
                const { data: commData } = await db
                    .from('committees')
                    .select('code, name')
                    .eq('code', committeeCode)
                    .single();

                if (commData) {
                    setCommittee(commData);
                }
            } catch (error) {
                console.error('Error loading sitting:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [committeeCode, sittingId]);

    // Parse agenda - it might be HTML string, array, or other format
    const parseAgenda = (agenda: any): string[] => {
        if (!agenda) return [];
        if (Array.isArray(agenda)) {
            return agenda.map(item =>
                typeof item === 'string' ? item : item.topic || JSON.stringify(item)
            );
        }
        if (typeof agenda === 'string') {
            // Check if it's HTML
            if (agenda.includes('<div')) {
                // Extract text from HTML divs
                const matches = agenda.match(/>([^<]+)</g);
                return matches ? matches.map(m => m.replace(/[><]/g, '').trim()).filter(Boolean) : [agenda];
            }
            return [agenda];
        }
        return [];
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-64"></div>
                    <div className="h-48 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!sitting) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Posiedzenie nie znalezione</h1>
                <Link to={`/komisje/${committeeCode}`} className="text-blue-600 hover:underline">
                    Wróć do komisji
                </Link>
            </div>
        );
    }

    const agendaItems = parseAgenda(sitting.agenda);
    const formattedDate = new Date(sitting.date).toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
            <SEO
                title={`Posiedzenie ${sitting.sitting_number} | ${committee?.name || committeeCode}`}
                description={`Szczegóły posiedzenia komisji sejmowej z dnia ${formattedDate}.`}
            />

            {/* Back button */}
            <Link
                to={`/komisje/${committeeCode}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
            >
                <ArrowLeft size={18} />
                Wróć do {committee?.name || 'komisji'}
            </Link>

            {/* Main Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <span className="text-sm font-mono text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {committeeCode}
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                            Posiedzenie nr {sitting.sitting_number}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {committee?.name}
                        </p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${sitting.status === 'FINISHED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {sitting.status === 'FINISHED' ? 'Zakończone' : sitting.status}
                    </span>
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar size={18} className="text-blue-500" />
                        <div>
                            <div className="text-xs text-slate-400">Data</div>
                            <div className="font-medium text-slate-900 dark:text-white">{formattedDate}</div>
                        </div>
                    </div>

                    {sitting.room && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin size={18} className="text-green-500" />
                            <div>
                                <div className="text-xs text-slate-400">Sala</div>
                                <div className="font-medium text-slate-900 dark:text-white text-sm">{sitting.room}</div>
                            </div>
                        </div>
                    )}

                    {sitting.start_time && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock size={18} className="text-purple-500" />
                            <div>
                                <div className="text-xs text-slate-400">Czas</div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                    {sitting.start_time?.slice(0, 5)}{sitting.end_time ? ` - ${sitting.end_time.slice(0, 5)}` : ''}
                                </div>
                            </div>
                        </div>
                    )}

                    {sitting.is_remote && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Users size={18} className="text-orange-500" />
                            <div>
                                <div className="text-xs text-slate-400">Tryb</div>
                                <div className="font-medium text-slate-900 dark:text-white">Zdalne</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Section */}
            {videoData && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 mb-6 text-white">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Video size={24} />
                        Nagranie Posiedzenia
                    </h2>

                    <div className="flex flex-col md:flex-row gap-4">
                        {videoData.playerLink && (
                            <a
                                href={videoData.playerLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors"
                            >
                                <Video size={20} />
                                Oglądaj na sejm.gov.pl
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>

                    {videoData.description && (
                        <p className="mt-4 text-red-100 text-sm">
                            {videoData.description}
                        </p>
                    )}
                </div>
            )}

            {/* Agenda Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Porządek Obrad
                </h2>

                {agendaItems.length > 0 ? (
                    <ol className="space-y-3">
                        {agendaItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                            >
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold rounded-full text-sm">
                                    {idx + 1}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        Brak danych o porządku obrad.
                    </div>
                )}
            </div>

            {/* Additional Info */}
            {sitting.is_closed && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                        ⚠️ To posiedzenie było zamknięte dla publiczności
                    </span>
                </div>
            )}
        </div>
    );
}

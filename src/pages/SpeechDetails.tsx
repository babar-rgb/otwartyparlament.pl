import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface Speech {
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

export default function SpeechDetails() {
    const { id } = useParams();
    const [speech, setSpeech] = useState<Speech | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSpeech = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('speeches')
                    .select(`
            *,
            mp:mps(id, name, party, photo_url)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setSpeech(data);
            } catch (err) {
                console.error('Error fetching speech:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpeech();
    }, [id]);

    if (loading) return <div className="text-center py-12">Ładowanie wypowiedzi...</div>;

    if (!speech) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Nie znaleziono wypowiedzi.</p>
                <Link to="/wypowiedzi" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
                    Wróć do listy
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-24 pb-12 px-4 animate-fade-in">
            {/* Back Button */}
            <Link to="/wypowiedzi" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                <ArrowLeft size={20} />
                Wróć do wyszukiwarki
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                        {speech.mp ? (
                            <Link to={`/poslowie/${speech.mp.id}`} className="group">
                                <img
                                    src={speech.mp.photo_url}
                                    alt={speech.mp.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-blue-200 transition-colors"
                                />
                            </Link>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User size={32} />
                            </div>
                        )}

                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">
                                {speech.mp ? (
                                    <Link to={`/poslowie/${speech.mp.id}`} className="hover:text-blue-600 transition-colors">
                                        {speech.mp.name}
                                    </Link>
                                ) : (
                                    speech.speaker_name
                                )}
                            </h1>
                            {speech.mp && (
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                    {speech.mp.party}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-medium text-sm mb-2">
                            <Calendar size={16} />
                            {speech.date}
                        </div>
                        <p className="text-slate-500 text-sm">
                            Posiedzenie {speech.sitting}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <div className="prose prose-lg prose-slate max-w-none">
                    {speech.content.split('\n').map((paragraph, idx) => (
                        paragraph.trim() && <p key={idx} className="text-slate-800 leading-relaxed mb-4">{paragraph}</p>
                    ))}
                </div>
            </div>

            {/* Context/Topic (Placeholder) */}
            {/* <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 mb-1">Kontekst wypowiedzi</h3>
          <p className="text-blue-800 text-sm">
            Ta wypowiedź dotyczyła punktu porządku dziennego: "{speech.topic || 'Sprawozdanie Komisji...'}"
          </p>
        </div>
      </div> */}
        </div>
    );
}

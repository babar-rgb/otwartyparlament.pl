import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, CheckCircle, XCircle, MinusCircle, Sparkles, ThumbsUp, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Tag } from 'lucide-react';


const ClubRow = ({ club }: { club: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    const total = club.yes + club.no + club.abstain;
    const yesPercent = (club.yes / total) * 100;
    const noPercent = (club.no / total) * 100;
    const abstainPercent = (club.abstain / total) * 100;

    // Determine majority vote for rebel detection
    let majorityVote = 'Wstrzym.';
    if (club.yes > club.no && club.yes > club.abstain) majorityVote = 'Za';
    else if (club.no > club.yes && club.no > club.abstain) majorityVote = 'Przeciw';

    // Use real MPs passed from parent
    const mps = club.mps || [];

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 transition-all">
            {/* Header */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                {/* Left: Badge & Name */}
                <div className="flex items-center gap-3 w-full md:w-1/4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white
            ${club.name === 'PiS' ? 'bg-blue-800' :
                            club.name === 'KO' ? 'bg-orange-500' :
                                club.name === 'Lewica' ? 'bg-red-600' :
                                    club.name === 'PL2050' ? 'bg-yellow-500' :
                                        club.name === 'Konfederacja' ? 'bg-blue-900' : 'bg-green-600'}`}
                    >
                        {club.name.substring(0, 3)}
                    </div>
                    <span className="font-bold text-slate-900">{club.name}</span>
                </div>

                {/* Middle: Progress Bar */}
                <div className="flex-1 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    {yesPercent > 0 && <div style={{ width: `${yesPercent}%` }} className="bg-vote-yes h-full" />}
                    {noPercent > 0 && <div style={{ width: `${noPercent}%` }} className="bg-red-500 h-full" />}
                    {abstainPercent > 0 && <div style={{ width: `${abstainPercent}%` }} className="bg-yellow-400 h-full" />}
                </div>

                {/* Right: Summary & Chevron */}
                <div className="flex items-center justify-between w-full md:w-auto gap-6">
                    <div className="text-xs font-bold text-slate-500 flex gap-3">
                        <span className="text-green-600">ZA: {club.yes}</span>
                        <span className="text-red-600">PRZECIW: {club.no}</span>
                        <span className="text-yellow-600">WSTRZ.: {club.abstain}</span>
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Szczegółowe Głosy (Próbka)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {mps.map((mp: any) => {
                            const isRebel = mp.vote !== majorityVote;
                            return (
                                <div
                                    key={mp.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg border bg-white ${isRebel ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                        <img src={mp.avatar} alt={mp.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate">{mp.name}</div>
                                        {isRebel && <div className="text-[10px] font-bold text-orange-600 uppercase">Głos odrębny</div>}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${mp.vote === 'Za' ? 'bg-vote-yesBg text-vote-yes border-vote-yes/20' :
                                        mp.vote === 'Przeciw' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {mp.vote}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 text-center">
                        <button className="text-xs font-bold text-blue-600 hover:underline">Zobacz wszystkich posłów tego klubu ({total})</button>
                    </div>
                </div>
            )}
        </div>
    );
};



import { MOCK_VOTES } from '../data/mockVotes';

export default function VoteDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Try to get vote from state, or find in MOCK_VOTES
    let vote = location.state?.vote;

    if (!vote && id) {
        const mockVote = MOCK_VOTES.find(v => v.id === parseInt(id));
        if (mockVote) {
            vote = {
                id: mockVote.id,
                date: mockVote.date,
                title_raw: mockVote.title,
                title_clean: mockVote.title,
                verdict: mockVote.verdict,
                voting_number: mockVote.voting_number,
                sitting: mockVote.sitting,
                yes: mockVote.votesYes,
                no: mockVote.votesNo,
                abstain: mockVote.votesAbstain,
                kind: mockVote.kind,
                topic: mockVote.categoryLabel,
                description: mockVote.description,
                pros: mockVote.pros,
                cons: mockVote.cons
            };
        }
    }

    const [isTechDetailsOpen, setIsTechDetailsOpen] = useState(false);

    if (!vote) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Brak danych głosowania</h2>
                    <button
                        onClick={() => navigate('/glosowania')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Wróć do listy
                    </button>
                </div>
            </div>
        );
    }

    const resultColor = vote.verdict === 'PRZYJĘTO' ? 'text-vote-yes bg-vote-yesBg border-vote-yes/20' : 'text-vote-no bg-vote-noBg border-vote-no/20';
    const resultIcon = vote.verdict === 'PRZYJĘTO' ? <CheckCircle size={32} /> : <XCircle size={32} />;
    const resultText = vote.verdict;

    // Construct Official Sejm URL
    const sitting = vote.sitting || 1;
    const sejmUrl = `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia=${sitting}&NrGlosowania=${vote.voting_number}`;



    // Extract "Druki" for technical section
    const drukiMatch = vote.title_raw.match(/\((?:druki|druk)\s*nr.*?\)/i);
    const druki = drukiMatch ? drukiMatch[0].replace(/[()]/g, '') : null;

    // Mock AI Analysis Data (use vote data if available, otherwise fallback)
    const aiAnalysis = {
        summary: vote.description || "Brak dostępnego podsumowania dla tego głosowania.",
        pros: vote.pros || [
            "Brak danych o zaletach.",
        ],
        cons: vote.cons || [
            "Brak danych o wadach.",
        ]
    };

    const [clubVotes, setClubVotes] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [voteResults, setVoteResults] = useState<any[]>([]);

    useEffect(() => {
        const loadResults = async () => {
            if (!vote?.id) return;

            // If it's a mock vote (ID >= 100), skip Supabase and use mock data
            if (vote.id >= 100) {
                setLoadingResults(false);

                // Generate mock club votes based on the total yes/no/abstain
                // This is a simple distribution for demo purposes
                const mockClubs = [
                    { name: 'PiS', size: 190, tendency: 'mixed' },
                    { name: 'KO', size: 157, tendency: 'for' },
                    { name: 'PL2050', size: 33, tendency: 'for' },
                    { name: 'Lewica', size: 26, tendency: 'for' },
                    { name: 'Konfederacja', size: 18, tendency: 'against' },
                    { name: 'Kukiz15', size: 3, tendency: 'mixed' }
                ];

                const generatedClubVotes = mockClubs.map(club => {
                    let yes = 0, no = 0, abstain = 0;

                    // Simple logic to distribute votes based on verdict and club tendency
                    // This is just to make the UI look populated
                    if (vote.verdict === 'PRZYJĘTO') {
                        if (club.tendency === 'for') { yes = Math.floor(club.size * 0.9); no = Math.floor(club.size * 0.05); }
                        else if (club.tendency === 'against') { yes = Math.floor(club.size * 0.2); no = Math.floor(club.size * 0.7); }
                        else { yes = Math.floor(club.size * 0.5); no = Math.floor(club.size * 0.4); }
                    } else {
                        if (club.tendency === 'for') { yes = Math.floor(club.size * 0.4); no = Math.floor(club.size * 0.5); }
                        else if (club.tendency === 'against') { yes = Math.floor(club.size * 0.05); no = Math.floor(club.size * 0.9); }
                        else { yes = Math.floor(club.size * 0.2); no = Math.floor(club.size * 0.7); }
                    }

                    abstain = club.size - yes - no;
                    if (abstain < 0) abstain = 0; // Safety check

                    return {
                        name: club.name,
                        yes,
                        no,
                        abstain,
                        mps: [] // No individual MPs for mock votes
                    };
                });

                setClubVotes(generatedClubVotes);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('vote_results')
                    .select('*, mps(name, party, photo_url)')
                    .eq('vote_id', vote.id);

                if (error) throw error;

                setVoteResults(data || []);

                // Calculate club stats
                const stats: Record<string, { name: string, yes: number, no: number, abstain: number, mps: any[] }> = {};

                data?.forEach((r: any) => {
                    const party = r.mps?.party || 'Niezrzeszeni';
                    if (!stats[party]) {
                        stats[party] = { name: party, yes: 0, no: 0, abstain: 0, mps: [] };
                    }

                    if (r.vote === 'YES') stats[party].yes++;
                    else if (r.vote === 'NO') stats[party].no++;
                    else if (r.vote === 'ABSTAIN') stats[party].abstain++;

                    stats[party].mps.push({
                        id: r.mp_id,
                        name: r.mps?.name,
                        vote: r.vote === 'YES' ? 'Za' : r.vote === 'NO' ? 'Przeciw' : r.vote === 'ABSTAIN' ? 'Wstrzym.' : 'Nieobecny',
                        club: party,
                        avatar: r.mps?.photo_url
                    });
                });

                setClubVotes(Object.values(stats).sort((a, b) => (b.yes + b.no + b.abstain) - (a.yes + a.no + a.abstain)));

            } catch (error) {
                console.error('Error loading vote results:', error);
            } finally {
                setLoadingResults(false);
            }
        };
        loadResults();
    }, [vote]);

    // Use vote object data if voteResults (real data) is empty
    const totalVotes = voteResults.length > 0 ? voteResults.length : (vote.yes + vote.no + vote.abstain);
    const yesVotes = voteResults.length > 0 ? voteResults.filter(r => r.vote === 'YES').length : vote.yes;
    const noVotes = voteResults.length > 0 ? voteResults.filter(r => r.vote === 'NO').length : vote.no;
    const abstainVotes = voteResults.length > 0 ? voteResults.filter(r => r.vote === 'ABSTAIN').length : vote.abstain;

    const yesPercent = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;
    const noPercent = totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0;

    // Donut Chart Calculation
    const radius = 40;

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl animate-fade-in">
            {/* Breadcrumb */}
            <button
                onClick={() => navigate('/glosowania')}
                className="flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
            >
                <ChevronLeft size={20} />
                Wróć do listy
            </button>

            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold border border-slate-200 flex items-center gap-2">
                            <Calendar size={14} />
                            {vote.date}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100 flex items-center gap-2">
                            <FileText size={14} />
                            Głosowanie nr {vote.voting_number}
                        </span>

                        <button
                            onClick={() => setIsTechDetailsOpen(!isTechDetailsOpen)}
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors ml-auto md:ml-0"
                        >
                            {isTechDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Pokaż szczegóły techniczne (druki, punkt obrad)
                        </button>
                    </div>

                    {/* Technical Details Accordion */}
                    {isTechDetailsOpen && (
                        <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-lg animate-fade-in mb-2">
                            <div className="mb-4 space-y-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Pełny Tytuł:</span>
                                    <p className="text-sm text-slate-700 font-mono leading-relaxed">{vote.title_raw}</p>
                                </div>

                                {druki && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Druki Sejmowe:</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                                            <Tag size={12} />
                                            {druki}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <a
                                href={sejmUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-black text-ink hover:bg-black hover:text-white transition-all text-sm font-bold"
                            >
                                <ExternalLink size={16} />
                                Zobacz na sejm.gov.pl
                            </a>
                        </div>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                    {vote.title_clean || vote.title_raw}
                </h1>

                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${resultColor}`}>
                    {resultIcon}
                    <span className="text-2xl font-black tracking-wide">{resultText}</span>
                </div>
            </div>

            {/* AI Analysis Card */}
            <div className="relative mb-12 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt blur opacity-20"></div>
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} />
                        <h2 className="font-bold text-slate-900 text-lg">Analiza AI</h2>
                        <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase tracking-wide ml-auto">Beta</span>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">O co chodzi?</h3>
                            <p className="text-slate-700 text-lg leading-relaxed">
                                {aiAnalysis.summary}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-vote-yesBg/50 rounded-xl p-6 border border-vote-yes/10">
                                <h3 className="flex items-center gap-2 font-bold text-green-800 mb-4 text-lg">
                                    <ThumbsUp size={20} />
                                    Potencjalne Korzyści
                                </h3>
                                <ul className="space-y-3">
                                    {aiAnalysis.pros.map((pro: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-slate-700">
                                            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                                            <span>{pro}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
                                <h3 className="flex items-center gap-2 font-bold text-red-800 mb-4 text-lg">
                                    <AlertTriangle size={20} />
                                    Ryzyka i Wady
                                </h3>
                                <ul className="space-y-3">
                                    {aiAnalysis.cons.map((con: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-slate-700">
                                            <MinusCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                            <span>{con}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Data Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Donut Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 w-full text-left">Wynik Głosowania</h3>

                    {loadingResults ? (
                        <div className="py-12 text-slate-500">Ładowanie wykresu...</div>
                    ) : (
                        <>
                            <div className="relative w-64 h-64">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    {/* Background Circle */}
                                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                </svg>
                                {/* Using CSS Conic Gradient for simplicity and perfect segments */}
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `conic-gradient(
                        #22c55e 0% ${yesPercent}%, 
                        #ef4444 ${yesPercent}% ${yesPercent + noPercent}%, 
                        #eab308 ${yesPercent + noPercent}% 100%
                        )`
                                    }}
                                ></div>
                                {/* Inner White Circle for Donut Effect */}
                                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900">{totalVotes}</span>
                                    <span className="text-sm font-bold text-slate-500 uppercase">Głosów</span>
                                </div>
                            </div>

                            <div className="flex justify-center gap-6 mt-8 w-full">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-green-600">{yesVotes}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Za</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-red-600">{noVotes}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Przeciw</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-yellow-500">{abstainVotes}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Wstrzym.</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Club Breakdown List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Głosowanie Klubów</h3>
                    {loadingResults ? (
                        <div className="text-center py-8 text-slate-500">Ładowanie wyników...</div>
                    ) : (
                        <div className="space-y-2">
                            {clubVotes.map((club) => (
                                <ClubRow key={club.name} club={club} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

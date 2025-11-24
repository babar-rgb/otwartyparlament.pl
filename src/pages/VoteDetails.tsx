import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, CheckCircle, XCircle, MinusCircle, Sparkles, ThumbsUp, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react';

// Mock function to generate MPs for a club
const generateMockMps = (clubName: string, voteType: 'Za' | 'Przeciw' | 'Wstrzym.', count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `${clubName} -${voteType} -${i} `,
        name: `Poseł ${clubName} ${i + 1} `,
        vote: voteType,
        club: clubName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clubName}${i}`, // Mock avatar
    }));
};

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

    // Generate mock MPs based on the vote counts
    // We only show a subset for the prototype to keep it clean
    const mps = [
        ...generateMockMps(club.name, 'Za', Math.min(club.yes, 5)),
        ...generateMockMps(club.name, 'Przeciw', Math.min(club.no, 5)),
        ...generateMockMps(club.name, 'Wstrzym.', Math.min(club.abstain, 5)),
    ];

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
                    {yesPercent > 0 && <div style={{ width: `${yesPercent}%` }} className="bg-green-500 h-full" />}
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
                        {mps.map((mp) => {
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
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${mp.vote === 'Za' ? 'bg-green-100 text-green-700 border-green-200' :
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

export default function VoteDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const vote = location.state?.vote;

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

    const resultColor = vote.yes > vote.no ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
    const resultIcon = vote.yes > vote.no ? <CheckCircle size={32} /> : <XCircle size={32} />;
    const resultText = vote.yes > vote.no ? 'PRZYJĘTO' : 'ODRZUCONO';

    // Construct Official Sejm URL
    // Assuming sitting is 1 for now as per prototype, or extract from vote if available
    const sitting = vote.sitting || 1;
    const sejmUrl = `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia=${sitting}&NrGlosowania=${vote.votingNumber}`;

    // Mock AI Analysis Data
    const aiAnalysis = {
        summary: "Ustawa ta ma na celu wprowadzenie istotnych zmian w systemie podatkowym, mających na celu uproszczenie rozliczeń dla małych i średnich przedsiębiorstw. Główne założenia obejmują podniesienie kwoty wolnej od podatku oraz zmianę stawek ryczałtowych.",
        pros: [
            "Zwiększenie płynności finansowej dla MŚP dzięki niższym obciążeniom.",
            "Uproszczenie biurokracji poprzez cyfryzację procesów rozliczeniowych.",
            "Zachęta do inwestycji w nowe technologie dzięki ulgom podatkowym."
        ],
        cons: [
            "Możliwy spadek wpływów do budżetu państwa w krótkim terminie.",
            "Ryzyko komplikacji w okresie przejściowym dla księgowych.",
            "Niejasne przepisy dotyczące niektórych branż usługowych."
        ]
    };

    // Mock Club Data
    const clubVotes = [
        { name: 'PiS', yes: 180, no: 10, abstain: 5 },
        { name: 'KO', yes: 0, no: 150, abstain: 0 },
        { name: 'PL2050', yes: 0, no: 33, abstain: 0 },
        { name: 'PSL', yes: 0, no: 28, abstain: 2 },
        { name: 'Konfederacja', yes: 15, no: 0, abstain: 3 },
        { name: 'Lewica', yes: 0, no: 26, abstain: 0 },
    ];

    const totalVotes = vote.yes + vote.no + vote.abstain;
    const yesPercent = Math.round((vote.yes / totalVotes) * 100);
    const noPercent = Math.round((vote.no / totalVotes) * 100);
    // const abstainPercent = Math.round((vote.abstain / totalVotes) * 100); // Unused for now

    // Donut Chart Calculation
    const radius = 40;
    // const circumference = 2 * Math.PI * radius; // Unused with conic-gradient approach

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold border border-slate-200 flex items-center gap-2">
                            <Calendar size={14} />
                            {vote.date}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100 flex items-center gap-2">
                            <FileText size={14} />
                            Głosowanie nr {vote.votingNumber}
                        </span>
                    </div>

                    <a
                        href={sejmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition-all text-sm font-bold self-start md:self-auto"
                    >
                        <ExternalLink size={16} />
                        Zobacz na sejm.gov.pl
                    </a>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                    {vote.title}
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
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Streszczenie</h3>
                            <p className="text-slate-700 text-lg leading-relaxed">
                                {aiAnalysis.summary}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
                                <h3 className="flex items-center gap-2 font-bold text-green-800 mb-4 text-lg">
                                    <ThumbsUp size={20} />
                                    Potencjalne Korzyści
                                </h3>
                                <ul className="space-y-3">
                                    {aiAnalysis.pros.map((pro, i) => (
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
                                    {aiAnalysis.cons.map((con, i) => (
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
                    <div className="relative w-64 h-64">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background Circle */}
                            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />

                            {/* Segments - Simplified for prototype (stacked logic needed for true donut, using simple representation) */}
                            {/* For a true donut in SVG without libraries, we need stroke-dasharray. 
                  Let's use a simpler approach: 3 circles layered or just a CSS conic gradient which is easier.
              */}
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
                            <div className="text-2xl font-black text-green-600">{vote.yes}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Za</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-red-600">{vote.no}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Przeciw</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-yellow-500">{vote.abstain}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Wstrzym.</div>
                        </div>
                    </div>
                </div>

                {/* Club Breakdown List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Głosowanie Klubów</h3>
                    <div className="space-y-2">
                        {clubVotes.map((club) => (
                            <ClubRow key={club.name} club={club} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

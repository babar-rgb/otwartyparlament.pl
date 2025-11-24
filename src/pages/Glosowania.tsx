import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ChevronLeft, ChevronRight, FileText, CheckCircle, XCircle, MinusCircle, SlidersHorizontal, LayoutGrid, X, Heart, TrendingUp, Wheat, GraduationCap, Shield, Scale, Building, Zap, Cpu, Users, Globe, Palette } from 'lucide-react';
import { fetchSittingVotes } from '../api';

const THEMES = [
  { name: 'Zdrowie', icon: Heart, count: 42, keywords: ['zdrowie', 'szpital', 'lekarz', 'pacjent', 'leków', 'medyc', 'in vitro'] },
  { name: 'Gospodarka', icon: TrendingUp, count: 68, keywords: ['podatek', 'vat', 'budżet', 'finans', 'bank', 'pieniądz', 'akcyz', 'dochod'] },
  { name: 'Rolnictwo', icon: Wheat, count: 23, keywords: ['roln', 'wieś', 'pasz', 'zboż', 'hodowla', 'zwierząt', 'koł gospodyń'] },
  { name: 'Edukacja', icon: GraduationCap, count: 31, keywords: ['szkoł', 'edukacj', 'naucz', 'oświat', 'uczelni', 'student'] },
  { name: 'Obronność', icon: Shield, count: 19, keywords: ['wojsk', 'obron', 'armi', 'żołnierz', 'granica'] },
  { name: 'Sprawiedliwość', icon: Scale, count: 54, keywords: ['sąd', 'praw', 'karn', 'kodeks', 'ustaw', 'trybunał', 'więzien'] },
  { name: 'Infrastruktura', icon: Building, count: 27, keywords: ['drog', 'kolej', 'mieszkan', 'budow', 'transport'] },
  { name: 'Energetyka', icon: Zap, count: 35, keywords: ['energi', 'prąd', 'węgiel', 'gaz', 'elektrown', 'oze'] },
  { name: 'Technologia', icon: Cpu, count: 16, keywords: ['cyfryzacj', 'internet', 'komputer', 'technolog'] },
  { name: 'Polityka Społeczna', icon: Users, count: 49, keywords: ['rodzin', 'dziec', 'senior', 'emeryt', 'socjal', 'pomoc'] },
  { name: 'Sprawy Zagraniczne', icon: Globe, count: 38, keywords: ['zagranic', 'uni', 'europej', 'ukrain', 'nato'] },
  { name: 'Kultura', icon: Palette, count: 14, keywords: ['kultur', 'sztuk', 'muzeum', 'artyst', 'dziedzictw'] },
];

const assignCategory = (title: string) => {
  const lowerTitle = title.toLowerCase();
  for (const theme of THEMES) {
    if (theme.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return theme.name;
    }
  }
  return 'Inne';
};

export default function Glosowania() {
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedResult, setSelectedResult] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const loadVotes = async () => {
      try {
        // Fetching votes from sitting #1 for prototype
        const data = await fetchSittingVotes(1);
        setVotes(data);
      } catch (error) {
        console.error('Error loading votes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVotes();
  }, []);

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Przyjęto': return 'bg-green-100 text-green-800 border-green-200';
      case 'Odrzucono': return 'bg-red-100 text-red-800 border-red-200';
      case 'Wstrzymano': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Przyjęto': return <CheckCircle size={16} className="mr-1" />;
      case 'Odrzucono': return <XCircle size={16} className="mr-1" />;
      case 'Wstrzymano': return <MinusCircle size={16} className="mr-1" />;
      default: return null;
    }
  };

  const handleThemeSelect = (theme: string) => {
    setSelectedTopic(theme);
    setIsThemesModalOpen(false);
  };

  const handleVoteClick = (vote: any) => {
    navigate('/glosowania/details', { state: { vote } });
  };

  // Filter votes
  const filteredVotes = votes.filter(vote => {
    const category = assignCategory(vote.title);
    const result = vote.yes > vote.no ? 'Przyjęto' : 'Odrzucono'; // Simple logic for prototype

    // Search
    if (searchTerm && !vote.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    // Topic
    if (selectedTopic && category !== selectedTopic) return false;
    // Result
    if (selectedResult && result !== selectedResult) return false;

    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
          Archiwum Głosowań Sejmu
        </h1>
        <p className="text-slate-600 text-lg">
          Przeglądaj i analizuj wszystkie decyzje podjęte przez Sejm X kadencji.
        </p>
      </div>

      {/* Persistent Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Szukaj po tytule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-slate-400"
          />
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsThemesModalOpen(true)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${selectedTopic
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <LayoutGrid size={18} />
            <span className="whitespace-nowrap">{selectedTopic || 'Obszary Tematyczne'}</span>
          </button>

          <button
            onClick={() => setIsAdvancedModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-all bg-white"
          >
            <SlidersHorizontal size={18} />
            <span className="whitespace-nowrap">Filtry Zaawansowane</span>
          </button>
        </div>
      </div>

      {/* Modal A: Themes (Obszary Tematyczne) */}
      {isThemesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsThemesModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 animate-pop-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20">
              <h2 className="text-2xl font-bold text-slate-900">Wybierz Obszar Tematyczny</h2>
              <button onClick={() => setIsThemesModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleThemeSelect('')}
                className={`p-6 rounded-xl border flex flex-col items-center text-center transition-all ${selectedTopic === ''
                  ? 'border-black bg-slate-50'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
              >
                <LayoutGrid className="w-10 h-10 text-slate-600 mb-3" />
                <span className="font-bold text-slate-900">Wszystkie</span>
              </button>
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeSelect(theme.name)}
                  className={`p-6 rounded-xl border flex flex-col items-center text-center transition-all ${selectedTopic === theme.name
                    ? 'border-black bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                >
                  <theme.icon className="w-10 h-10 text-slate-600 mb-3" />
                  <span className="font-bold text-slate-900">{theme.name}</span>
                  <span className="text-xs text-slate-500 mt-1">{theme.count} głosowań</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Advanced Filters */}
      {isAdvancedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdvancedModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-pop-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Filtry Zaawansowane</h2>
              <button onClick={() => setIsAdvancedModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">Zakres Dat</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Od</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-0 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Do</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-0 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">Rodzaj Dokumentu</label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {['Ustawa', 'Wniosek', 'Uchwała'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? '' : type)}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${selectedType === type
                        ? 'bg-white text-black shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">Wynik Głosowania</label>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Przyjęto', activeClass: 'bg-green-600 text-white border-green-600' },
                    { label: 'Odrzucono', activeClass: 'bg-red-600 text-white border-red-600' },
                    { label: 'Wstrzymano', activeClass: 'bg-yellow-500 text-white border-yellow-500' }
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setSelectedResult(selectedResult === item.label ? '' : item.label)}
                      className={`w-full py-3 px-4 rounded-lg border text-sm font-bold uppercase tracking-wide transition-all ${selectedResult === item.label
                        ? item.activeClass
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setIsAdvancedModalOpen(false)}
                className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg"
              >
                Zastosuj Filtry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 uppercase tracking-wide text-sm">
            Wyniki ({filteredVotes.length} Głosowań)
          </h2>
          <div className="text-xs text-slate-500 font-medium">
            Strona 1 z 1
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Ładowanie danych...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVotes.map((vote) => {
              const category = assignCategory(vote.title);
              const result = vote.yes > vote.no ? 'Przyjęto' : 'Odrzucono';

              return (
                <div
                  key={vote.votingNumber}
                  onClick={() => handleVoteClick({ ...vote, result })}
                  className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date & Type */}
                    <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-1 min-w-[100px]">
                      <div className="text-sm font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {vote.date}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        Głosowanie {vote.votingNumber}
                      </span>
                    </div>

                    {/* Title & Topic */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                        {vote.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <FileText size={12} />
                          {category}
                        </span>
                      </div>
                    </div>

                    {/* Verdict Badge */}
                    <div className="flex items-center justify-between md:justify-end min-w-[140px] mt-2 md:mt-0">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border flex items-center ${getResultColor(result)}`}>
                        {getResultIcon(result)}
                        {result}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-700">
            1 / 1
          </span>
          <button className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

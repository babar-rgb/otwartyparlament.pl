import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import VoteItem from '../components/VoteItem';

export default function CategoryDetails() {
    const { slug } = useParams<{ slug: string }>();

    // Helper to format slug into title (e.g., "polityka-spoleczna" -> "Polityka Społeczna")
    const formatTitle = (s: string) => {
        return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const title = slug ? formatTitle(slug) : 'Kategoria';

    // Mock Data Generation based on slug
    const getMockVotes = (slug: string) => {
        switch (slug) {
            case 'zdrowie':
                return [
                    { id: 1, title: 'Ustawa o refundacji leków onkologicznych', description: 'Rozszerzenie listy leków refundowanych o nowoczesne terapie przeciwnowotworowe.', date: '14 Listopada 2023', result: 'PRZYJĘTO', yes: 412, no: 12 },
                    { id: 2, title: 'Wotum nieufności dla Ministra Zdrowia', description: 'Wniosek opozycji w związku z sytuacją na oddziałach ratunkowych.', date: '20 Października 2023', result: 'ODRZUCONO', yes: 180, no: 235 },
                    { id: 3, title: 'Nowelizacja ustawy o zawodzie lekarza', description: 'Zmiany w systemie kształcenia podyplomowego lekarzy i lekarzy dentystów.', date: '15 Września 2023', result: 'PRZYJĘTO', yes: 430, no: 0 },
                    { id: 4, title: 'Program "Szpital Plus"', description: 'Dofinansowanie szpitali powiatowych w celu modernizacji infrastruktury.', date: '05 Lipca 2023', result: 'PRZYJĘTO', yes: 250, no: 190 },
                    { id: 5, title: 'Ustawa o jakości w opiece zdrowotnej', description: 'Wprowadzenie nowych standardów akredytacji placówek medycznych.', date: '12 Czerwca 2023', result: 'ODRZUCONO', yes: 200, no: 240 },
                ];
            case 'rolnictwo':
                return [
                    { id: 1, title: 'Dopłaty do nawozów mineralnych', description: 'Interwencyjne wsparcie dla rolników w związku z rosnącymi cenami gazu.', date: '10 Listopada 2023', result: 'PRZYJĘTO', yes: 440, no: 5 },
                    { id: 2, title: 'Ustawa o ochronie zwierząt hodowlanych', description: 'Zaostrzenie przepisów dotyczących warunków transportu zwierząt.', date: '25 Września 2023', result: 'ODRZUCONO', yes: 150, no: 280 },
                    { id: 3, title: 'System ubezpieczeń upraw rolnych', description: 'Reforma systemu dopłat do ubezpieczeń od klęsk żywiołowych.', date: '08 Sierpnia 2023', result: 'PRZYJĘTO', yes: 400, no: 40 },
                    { id: 4, title: 'Fundusz Ochrony Rolnictwa', description: 'Utworzenie funduszu gwarancyjnego dla producentów rolnych.', date: '15 Maja 2023', result: 'PRZYJĘTO', yes: 235, no: 210 },
                ];
            case 'obronnosc':
                return [
                    { id: 1, title: 'Ustawa o obronie Ojczyzny', description: 'Kompleksowa reforma sił zbrojnych i zwiększenie wydatków na obronność do 3% PKB.', date: '11 Listopada 2023', result: 'PRZYJĘTO', yes: 450, no: 0 },
                    { id: 2, title: 'Zakup systemów obrony powietrznej', description: 'Ratifikacja umowy międzynarodowej dotyczącej zakupu systemów rakietowych.', date: '01 Października 2023', result: 'PRZYJĘTO', yes: 420, no: 20 },
                    { id: 3, title: 'Zwiększenie liczebności WOT', description: 'Nowelizacja ustawy o powszechnym obowiązku obrony.', date: '15 Sierpnia 2023', result: 'PRZYJĘTO', yes: 280, no: 160 },
                ];
            default:
                return [
                    { id: 1, title: `Nowelizacja ustawy w zakresie: ${title}`, description: 'Dostosowanie przepisów krajowych do dyrektyw Unii Europejskiej.', date: '12 Listopada 2023', result: 'PRZYJĘTO', yes: 300, no: 140 },
                    { id: 2, title: 'Sprawozdanie komisji sejmowej', description: 'Rozpatrzenie sprawozdania z wykonania budżetu państwa w danej części.', date: '20 Października 2023', result: 'PRZYJĘTO', yes: 240, no: 210 },
                    { id: 3, title: 'Wniosek o odrzucenie projektu w pierwszym czytaniu', description: 'Głosowanie proceduralne nad projektem poselskim.', date: '05 Września 2023', result: 'ODRZUCONO', yes: 190, no: 260 },
                    { id: 4, title: 'Zmiana w składach komisji', description: 'Uzupełnienie składu osobowego komisji stałych.', date: '15 Lipca 2023', result: 'PRZYJĘTO', yes: 430, no: 10 },
                ];
        }
    };

    const votes = getMockVotes(slug || '');
    const stats = {
        total: votes.length,
        accepted: votes.filter(v => v.result === 'PRZYJĘTO').length,
        rejected: votes.filter(v => v.result === 'ODRZUCONO').length,
    };

    return (
        <div className="min-h-screen bg-paper py-12 px-6">
            <div className="container mx-auto max-w-5xl">

                {/* Breadcrumbs */}
                <Link to="/" className="inline-flex items-center text-ink-light hover:text-brand transition mb-8 group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Wróć do strony głównej
                </Link>

                {/* Hero Section */}
                <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-ink mb-4 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-xl text-ink-light max-w-2xl mb-8">
                        Przegląd legislacji, kluczowych głosowań i debat w obszarze: {title}.
                    </p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Liczba Głosowań</p>
                                <p className="text-3xl font-bold text-ink">{stats.total}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-vote-yesBg rounded-full flex items-center justify-center text-vote-yes">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Przyjęte</p>
                                <p className="text-3xl font-bold text-ink">{stats.accepted}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-vote-noBg rounded-full flex items-center justify-center text-vote-no">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Odrzucone</p>
                                <p className="text-3xl font-bold text-ink">{stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Votes List */}
                <div className="space-y-0">
                    <h2 className="text-2xl font-bold text-ink mb-6 border-b border-gray-200 pb-4">
                        Ostatnie Głosowania
                    </h2>
                    {votes.map((vote, index) => (
                        <Link
                            key={vote.id}
                            to={`/glosowania/${vote.id}`}
                            state={{
                                vote: {
                                    id: vote.id,
                                    date: vote.date,
                                    title_raw: vote.title,
                                    title_clean: vote.title,
                                    verdict: vote.result,
                                    voting_number: vote.id + 100, // Mock voting number
                                    sitting: 1, // Mock sitting
                                    yes: vote.yes,
                                    no: vote.no,
                                    abstain: 0,
                                    kind: 'Głosowanie',
                                    topic: title
                                }
                            }}
                            className="block transition-transform active:scale-[0.99]"
                        >
                            <VoteItem
                                index={index + 1}
                                title={vote.title}
                                description={vote.description}
                                date={vote.date}
                                result={vote.result as 'PRZYJĘTO' | 'ODRZUCONO'}
                                votesYes={vote.yes}
                                votesNo={vote.no}
                            />
                        </Link>
                    ))}
                </div>

            </div>
        </div>
    );
}

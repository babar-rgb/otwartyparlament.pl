import { ShieldCheck, Link2, BarChart3, Fingerprint, Search, Cpu, CheckCircle2, AlertCircle, Wallet, Sparkles, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';

export default function Metodologia() {
    const sections = [
        {
            id: 'weryfikacja',
            title: 'Skąd bierzemy i jak sprawdzamy dane',
            icon: <ShieldCheck className="w-6 h-6" />,
            description: 'Oficjalne źródła i automatyczna kontrola',
            details: [
                {
                    label: 'Oficjalne dane z Sejmu',
                    content: 'Wszystkie informacje pobieramy bezpośrednio z oficjalnych systemów informatycznych Sejmu RP (API). Dzięki temu masz pewność, że to co widzisz u nas, jest dokładnie tym, co widnieje w rejestrach państwowych.'
                },
                {
                    label: 'Automatyczne sprawdzanie',
                    content: 'Nasz system co kilkanaście minut zagląda do Sejmu i sprawdza, czy coś się nie zmieniło. Jeśli pojawi się nowe głosowanie lub poprawka, strona aktualizuje się automatycznie.'
                },
                {
                    label: 'Dane „tylko do odczytu”',
                    content: 'Gdy raz pobierzemy wynik głosowania, nikt nie może go u nas ręcznie edytować. Każda zmiana statusu ustawy jest zapisywana jako nowe zdarzenie, więc zawsze możemy wrócić do tego, jak dana sprawa wyglądała wcześniej.'
                }
            ]
        },
        {
            id: 'routing',
            title: 'Jak łączymy fakty',
            icon: <Link2 className="w-6 h-6" />,
            description: 'Logika łączenia ustaw, głosowań i posłów',
            details: [
                {
                    label: 'Dobre dopasowanie',
                    content: 'Ustawy i głosowania łączymy za pomocą ich unikalnych numerów id, a nie tylko po tytule. To wyklucza pomyłki, gdy dwa projekty mają bardzo podobne nazwy.'
                },
                {
                    label: 'Kto jest kim',
                    content: 'Każdy poseł ma swój profil, do którego przypisujemy jego głosowania i projekty. Sprawdzamy, czy w danym momencie poseł faktycznie brał udział w pracach danej komisji, by uniknąć błędnych powiązań.'
                }
            ]
        },
        {
            id: 'statystyki',
            title: 'Jak liczymy statystyki',
            icon: <BarChart3 className="w-6 h-6" />,
            description: 'Zasady liczenia frekwencji i "rebelii"',
            details: [
                {
                    label: 'Frekwencja',
                    content: 'Liczymy po prostu: w ilu głosowaniach poseł wziął udział, a ile opuścił. Jeśli poseł był usprawiedliwiony (np. choroba), zaznaczamy to zgodnie z oficjalnym komunikatem Sejmu.'
                },
                {
                    label: 'Głosowanie pod prąd',
                    content: 'Sprawdzamy, jak głosowała większość członków danej partii. Jeśli poseł zagłosował inaczej niż reszta jego kolegów i koleżanek z klubu, system odnotowuje to jako głos "pod prąd" (tzw. rebelia).'
                }
            ]
        },
        {
            id: 'ai-logic',
            title: 'Algorytmy i Bliźniak Ideowy',
            icon: <Cpu className="w-6 h-6" />,
            description: 'Jak szukamy posłów o podobnych poglądach?',
            details: [
                {
                    label: 'Bliźniak Ideowy',
                    content: 'To prosty mechanizm porównywania głosowań. System sprawdza Twoje odpowiedzi i szuka posłów, którzy w prawdziwym Sejmie głosowali najczęściej tak samo jak Ty. Im więcej wspólnych decyzji, tym wyższe dopasowanie.'
                },
                {
                    label: 'Tematy ustaw (AI)',
                    content: 'Używamy sztucznej inteligencji, by "przeczytała" tytuł każdej ustawy i zrozumiała, o czym ona jest. Dzięki temu projekty o podatkach trafiają do finansów, a te o parkach narodowych do ekologii – bez ręcznego przepisywania.'
                }
            ]
        },
        {
            id: 'majatek',
            title: 'Pieniądze i oświadczenia (OCR)',
            icon: <Wallet className="w-6 h-6" />,
            description: 'Skąd wiemy, ile majątku mają posłowie?',
            details: [
                {
                    label: 'Czytanie skanów',
                    content: 'Posłowie często wypełniają oświadczenia ręcznie na kartce. Nasze programy analizują te skany i zamieniają pismo odręczne na liczby, które można łatwo filtrować i porównywać.'
                },
                {
                    label: 'Sprawdzanie błędów',
                    content: 'System automatycznie flaguje dziwne sytuacje – np. gdy suma składników majątku nagle drastycznie się zmienia. Takie przypadki sprawdzamy dodatkowo ręcznie, by uniknąć pomyłek w bazie.'
                }
            ]
        },
        {
            id: 'stack',
            title: 'Technologie, których używamy',
            icon: <Sparkles className="w-6 h-6" />,
            description: 'Na czym postawiony jest projekt?',
            details: [
                {
                    label: 'Baza danych',
                    content: 'Korzystamy ze standardowej bazy PostgreSQL, która pozwala nam szybko wyszukiwać informacje i liczyć podobieństwa między tysiącami głosowań.'
                },
                {
                    label: 'Bezpieczne AI',
                    content: 'Nasze modele AI działają na naszych serwerach, a nie w chmurze gigantów z USA. To oznacza, że Twoje dane (np. odpowiedzi w teście) nie są wysyłane do zewnętrznych firm.'
                },
                {
                    label: 'Szybkość działania',
                    content: 'Używamy nowoczesnych narzędzi (FastAPI i React), by strona ładowała się szybko nawet przy dużej liczbie danych o głosowaniach.'
                }
            ]
        },
        {
            id: 'community',
            title: 'Kontrola społeczna i błędy',
            icon: <MessageSquare className="w-6 h-6" />,
            description: 'Co jeśli znajdziesz błąd?',
            details: [
                {
                    label: 'Zgłoś błąd',
                    content: 'Każdy może się pomylić. Jeśli widzisz, że coś się nie zgadza, możesz to łatwo zgłosić. Sprawdzimy to z oficjalnym Dziennikiem Ustaw i poprawimy, jeśli faktycznie jest błąd.'
                },
                {
                    label: 'Otwarty kod',
                    content: 'Nasz kod jest publiczny. Każdy programista może wejść na GitHub, zobaczyć jak działają nasze algorytmy i upewnić się, że nie ma w nich żadnych ukrytych "sztuczek" czy stronniczości.'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-page pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
            <SEO
                title="Metodologia i Weryfikacja Danych"
                description="Dowiedz się, jak zbieramy i sprawdzamy dane z Sejmu RP, byś mógł nam ufać."
            />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/20 mb-8 backdrop-blur-md">
                        <Fingerprint size={14} />
                        Wersja Metodologii 1.1
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-primary mb-8 tracking-tighter leading-tight">
                        Jak <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Działamy.</span>
                    </h1>
                    <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed font-medium">
                        Otwarty Parlament to projekt oparty na faktach. Nie interpretujemy polityki – pokazujemy twarde dane. Poniżej wyjaśniamy po ludzku, skąd je bierzemy i jak dbamy o ich rzetelność.
                    </p>
                </div>

                {/* Methodology Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                    {sections.map((section) => (
                        <div key={section.id} className="bg-surface border border-border-base rounded-[3rem] p-10 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-primary/[0.02] group-hover:text-primary/[0.05] transition-colors -rotate-12 translate-x-12 -translate-y-8">
                                {section.icon}
                            </div>

                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-primary tracking-tight">{section.title}</h2>
                                    <p className="text-xs text-secondary font-bold uppercase tracking-widest leading-tight">{section.description}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {section.details.map((detail, idx) => (
                                    <div key={idx} className="border-l-2 border-emerald-500/20 pl-6 group-hover:border-emerald-500 transition-colors">
                                        <h4 className="font-black text-sm text-primary mb-2 flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            {detail.label}
                                        </h4>
                                        <p className="text-sm text-secondary font-medium leading-relaxed">
                                            {detail.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Deep Dive Section */}
                <div className="bg-surface rounded-[4rem] border border-border-base p-12 md:p-20 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-4 mb-8">
                            <AlertCircle className="w-8 h-8 text-indigo-500" />
                            <h3 className="text-3xl font-black text-primary tracking-tight">Częste pytania o dane</h3>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h4 className="text-lg font-bold text-primary mb-4 italic">Skąd pewność, że poseł brał udział w danej ustawie?</h4>
                                <p className="text-secondary leading-relaxed font-medium pl-6 border-l border-border-base">
                                    Łączymy dane z oficjalnego systemu Sejmu. Jeśli poseł jest wymieniony jako autor (wnioskodawca) w druku sejmowym, to trafia on na jego profil. Obok każdego projektu znajdziesz link do oryginalnego PDF-a z Sejmu – możesz to sprawdzić samemu w dowolnym momencie.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-primary mb-4 italic">Jak łączycie różne fakty w jedną całość?</h4>
                                <p className="text-secondary leading-relaxed font-medium pl-6 border-l border-border-base">
                                    Każde głosowanie, wystąpienie czy interpelacja ma swój unikalny numer w systemie sejmowym. Nasze algorytmy dbają o to, by przypisać te działania do właściwej osoby i właściwego projektu ustawy. Co noc uruchamiamy testy, które sprawdzają, czy wszystkie te "puzzle" do siebie pasują.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-24 pt-12 border-t border-border-base flex flex-col md:flex-row justify-between items-center gap-8 opacity-60">
                    <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">
                        Ostatnia aktualizacja metodologii: Styczeń 2026
                    </p>
                    <div className="flex items-center gap-4">
                        <Search className="w-4 h-4" />
                        <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Dokumentacja techniczna dostępna w repozytorium</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

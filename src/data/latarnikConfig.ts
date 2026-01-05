export interface CuratedVoteConfig {
    sitting: number;
    voting_number: number;
    topic: string;
    title: string;
    description: string;
    divide_comment: string;
}

export const LATARNIK_VOTES: CuratedVoteConfig[] = [
    {
        sitting: 15,
        voting_number: 9,
        topic: "Prawa Kobiet",
        title: "Dekryminalizacja aborcji",
        description: "Czy jesteś za zniesieniem kar za pomoc w przeprowadzeniu aborcji? Projekt zmiany Kodeksu Karnego miał na celu ochronę bliskich i lekarzy pomagających kobietom.",
        divide_comment: "Światopogląd: KO, Lewica vs PiS, Konf, PSL"
    },
    {
        sitting: 15,
        voting_number: 77,
        topic: "Praworządność",
        title: "Reforma KRS",
        description: "Czy popierasz zmianę sposobu wyboru sędziów do Krajowej Rady Sądownictwa, tak aby sędziowie byli wybierani przez sędziów, a nie przez Sejm?",
        divide_comment: "Praworządność: Koalicja vs PiS"
    },
    {
        sitting: 1,
        voting_number: 35,
        topic: "Gospodarka",
        title: "Dwie niedziele handlowe",
        description: "Czy jesteś za przywróceniem handlu w dwie niedziele w miesiącu? Zwolennicy wskazują na wolność wyboru, przeciwnicy na prawa pracowników.",
        divide_comment: "Gospodarka: PL2050, KO vs Lewica, PiS"
    },
    {
        sitting: 22,
        voting_number: 175,
        topic: "Energia",
        title: "Mrożenie cen prądu",
        description: "Czy popierasz przedłużenie mechanizmów osłonowych chroniących gospodarstwa domowe przed gwałtownym wzrostem cen energii (Bon Energetyczny)?",
        divide_comment: "Socjalne: Prawie wszyscy (ważna jednomyślność)"
    },
    {
        sitting: 23,
        voting_number: 11,
        topic: "Podatki",
        title: "Obniżenie Składki Zdrowotnej",
        description: "Czy popierasz zmiany w naliczaniu składki zdrowotnej dla przedsiębiorców, które zmniejszyłyby ich obciążenia finansowe?",
        divide_comment: "Podatki: PL2050, PSL, Konf vs Lewica, KO"
    },
    {
        sitting: 9,
        voting_number: 18,
        topic: "Mieszkalnictwo",
        title: "Kredyt 0% / Na Start",
        description: "Czy państwo powinno dopłacać do kredytów hipotecznych (program 'Na Start')? Zwolennicy mówią o dostępności mieszkań, przeciwnicy o wzroście ich cen.",
        divide_comment: "Mieszkalnictwo: KO, PSL vs PL2050, Lewica, Konf"
    },
    {
        sitting: 15,
        voting_number: 50,
        topic: "Bezpieczeństwo",
        title: "Użycie broni na granicy",
        description: "Czy popierasz ułatwienie służbom mundurowym użycia broni palnej w przypadku zagrożenia na granicy państwowej?",
        divide_comment: "Bezpieczeństwo: KO, PiS, PSL vs Lewica, Konf (część)"
    },
    {
        sitting: 18,
        voting_number: 36,
        topic: "Podatki",
        title: "Kwota wolna 60 tys. zł",
        description: "Głosowanie nad wprowadzeniem wyższej kwoty wolnej od podatku (60 tys. zł). Czy jesteś za tak szybką i radykalną obniżką podatków?",
        divide_comment: "Budżet: Konf, PiS vs Koalicja (blokowanie)"
    },
    {
        sitting: 17,
        voting_number: 26,
        topic: "Praworządność",
        title: "Reforma Trybunału Konstytucyjnego",
        description: "Głosowanie nad uchwałą Senatu w sprawie ustawy o Trybunale Konstytucyjnym. Czy popierasz zmiany mające 'odpolitycznić' Trybunał?",
        divide_comment: "Praworządność: Koalicja (ZA) vs PiS (PRZECIW)"
    },
    {
        sitting: 11,
        voting_number: 16,
        topic: "Gospodarka",
        title: "Wakacje składkowe ZUS",
        description: "Czy popierasz wprowadzenie tzw. wakacji składkowych dla mikroprzedsiębiorców (jeden miesiąc bez składek na ubezpieczenie społeczne)?",
        divide_comment: "Gospodarka: Prawie cały Sejm ZA"
    }
];

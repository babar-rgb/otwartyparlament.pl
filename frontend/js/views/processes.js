// views/processes.js — Widok "Projekty Ustaw".
// TODO: Backend — model Process + endpoint /api/processes + seed (Faza 6)
// Na razie: informacyjny placeholder zgodny z estetyką portalu.

templates.processes = () => `
    <div class="data-view-container">
        <h1 class="view-title">Projekty Ustaw</h1>

        <div class="processes-coming-soon">
            <div class="processes-cs-tag">[ W PRZYGOTOWANIU ]</div>
            <p class="processes-cs-text">
                Śledzimy ścieżkę legislacyjną każdej ustawy — od złożenia projektu,
                przez czytania sejmowe, aż po podpis Prezydenta lub weto.
                Moduł zostanie aktywowany wraz z zasileniem bazy danych.
            </p>
            <div class="processes-cs-stats">
                <div class="processes-cs-stat">
                    <strong>X</strong>
                    <span>PROJEKTÓW W BAZIE</span>
                </div>
                <div class="processes-cs-stat">
                    <strong>X</strong>
                    <span>UCHWALONYCH</span>
                </div>
                <div class="processes-cs-stat">
                    <strong>X</strong>
                    <span>ODRZUCONYCH</span>
                </div>
            </div>
        </div>

        <div class="processes-roadmap">
            <div class="processes-roadmap-title">PLANOWANA STRUKTURA DANYCH</div>
            <div class="processes-roadmap-item">
                <span class="roadmap-step">01</span>
                <span class="roadmap-label">ZŁOŻENIE PROJEKTU — autor, data, numer druku</span>
            </div>
            <div class="processes-roadmap-item">
                <span class="roadmap-step">02</span>
                <span class="roadmap-label">CZYTANIA SEJMOWE — wyniki głosowań na każdym etapie</span>
            </div>
            <div class="processes-roadmap-item">
                <span class="roadmap-step">03</span>
                <span class="roadmap-label">SENAT — przyjęcie, poprawki lub odrzucenie</span>
            </div>
            <div class="processes-roadmap-item">
                <span class="roadmap-step">04</span>
                <span class="roadmap-label">PREZYDENT — podpis lub weto</span>
            </div>
        </div>
    </div>
`;

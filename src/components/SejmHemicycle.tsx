import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MPData {
    name: string;
    party: string;
    photo_url: string;
    vote: string; // 'YES', 'NO', 'ABSTAIN', 'ABSENT'
    id?: number;
    seat_number?: number | null; // Database seat number
}

interface SejmHemicycleProps {
    data: MPData[];
}

interface Seat {
    id: number;
    x: number;
    y: number;
}

// Config for "Cinema Seating"
const SECTORS_COUNT = 5;
const ROWS_COUNT = 14;
const ROW_CAPACITIES = [4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9];
const RADIUS_INNER = 140;
const RADIUS_OUTER = 460;
const START_ANGLE = Math.PI * 0.1;
const END_ANGLE = Math.PI * 0.9;
const TOTAL_SPAN = END_ANGLE - START_ANGLE;
const AISLE_WIDTH = 0.04;
const TOTAL_AISLE_SPACE = (SECTORS_COUNT - 1) * AISLE_WIDTH;
const USABLE_ANGLE = TOTAL_SPAN - TOTAL_AISLE_SPACE;
const SECTOR_ANGLE = USABLE_ANGLE / SECTORS_COUNT;

// Pure function to generate immutable seat map
const generateSejmLayout = (): Seat[] => {
    const seats: Seat[] = [];
    let globalSeatId = 0;

    for (let s = 0; s < SECTORS_COUNT; s++) {
        const sectorStartAngle = END_ANGLE - (s * (SECTOR_ANGLE + AISLE_WIDTH));

        for (let r = 0; r < ROWS_COUNT; r++) {
            const seatsInRow = ROW_CAPACITIES[r];
            const radius = RADIUS_INNER + (r * (RADIUS_OUTER - RADIUS_INNER) / (ROWS_COUNT - 1));
            const angleStep = SECTOR_ANGLE / seatsInRow;

            for (let i = 0; i < seatsInRow; i++) {
                const angle = sectorStartAngle - (angleStep / 2) - (i * angleStep);
                const x = radius * Math.cos(angle);
                const y = -radius * Math.sin(angle);

                seats.push({
                    id: globalSeatId++,
                    x,
                    y
                });
            }
        }
    }
    return seats;
};

// Memoize globally to avoid recalc
const FIXED_SEATS = generateSejmLayout();

const SejmHemicycle: React.FC<SejmHemicycleProps> = ({ data }) => {
    const navigate = useNavigate();
    const [hoveredMP, setHoveredMP] = useState<MPData | null>(null);

    // 1. Sort MPs Logic (Needed for Fallback and Overflow ordering)
    const sortedMPs = useMemo(() => {
        const partyConfiguration: Record<string, { order: number }> = {
            "Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PP, Unia Pracy, Inicjatywa Polska)": { order: 1 },
            "Lewica": { order: 1 },
            "Klub Parlamentarny Koalicja Obywatelska - Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni": { order: 2 },
            "KO": { order: 2 },
            "Koalicja Obywatelska": { order: 2 },
            "Klub Parlamentarny Polska 2050 - Trzecia Droga": { order: 3 },
            "Polska 2050": { order: 3 },
            "Klub Parlamentarny Polskie Stronnictwo Ludowe - Trzecia Droga": { order: 3 },
            "PSL": { order: 3 },
            "Trzecia Droga": { order: 3 },
            "Klub Parlamentarny Prawo i Sprawiedliwość": { order: 4 },
            "PiS": { order: 4 },
            "Prawo i Sprawiedliwość": { order: 4 },
            "Klub Parlamentarny Konfederacja": { order: 5 },
            "Konfederacja": { order: 5 },
            "Kukiz'15": { order: 4 },
            "Posłowie Niezrzeszeni": { order: 6 }
        };

        const getOrder = (party: string) => {
            if (!party) return 6;
            for (const key in partyConfiguration) {
                if (party.includes(key)) return partyConfiguration[key].order;
            }
            return 6;
        };

        return [...data].sort((a, b) => {
            const ordA = getOrder(a.party);
            const ordB = getOrder(b.party);
            if (ordA !== ordB) return ordA - ordB;
            if (a.vote !== b.vote) return a.vote.localeCompare(b.vote);
            return a.name.localeCompare(b.name);
        });
    }, [data]);

    // 2. Robust Mapping Logic (Audit Fix)
    const { occupiedSeats, overflowMPs } = useMemo(() => {
        const assigned = new Map<number, MPData>();
        const overflow: MPData[] = [];
        const usedSeatIds = new Set<number>();

        // Check if we have seat numbers
        const hasSeatNumbers = data.some(mp => mp.seat_number !== undefined && mp.seat_number !== null);

        if (hasSeatNumbers) {
            // STRICT MODE
            sortedMPs.forEach(mp => {
                if (typeof mp.seat_number === 'number' && mp.seat_number >= 0 && mp.seat_number < 460) {
                    if (usedSeatIds.has(mp.seat_number)) {
                        overflow.push(mp);
                    } else {
                        assigned.set(mp.seat_number, mp);
                        usedSeatIds.add(mp.seat_number);
                    }
                } else {
                    overflow.push(mp);
                }
            });
        } else {
            // FALLBACK MODE
            sortedMPs.forEach((mp, idx) => {
                if (idx < 460) {
                    assigned.set(idx, mp);
                } else {
                    overflow.push(mp);
                }
            });
        }

        return { occupiedSeats: assigned, overflowMPs: overflow };
    }, [sortedMPs, data]);

    const getColor = (vote: string) => {
        switch (vote) {
            case 'YES': return '#16a34a';
            case 'NO': return '#dc2626';
            case 'ABSTAIN': return '#f59e0b';
            case 'ABSENT': return '#d4d4d8';
            default: return '#e5e7eb';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, mp?: MPData) => {
        if ((e.key === 'Enter' || e.key === ' ') && mp?.id) {
            e.preventDefault();
            navigate(`/poslowie/${mp.id}`);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Main Hemicycle */}
            <div className="relative flex justify-center w-full overflow-hidden">
                <svg
                    viewBox="-480 -500 960 560"
                    className="w-full h-auto max-h-[60vh] select-none"
                    style={{ maxWidth: '100%' }}
                    role="img"
                    aria-label="Mapa głosowania w Sali Sejmowej"
                >
                    {FIXED_SEATS.map((seat) => {
                        const occupant = occupiedSeats.get(seat.id);

                        return (
                            <g key={seat.id}>
                                <circle
                                    cx={seat.x}
                                    cy={seat.y}
                                    r={6}
                                    fill={occupant ? getColor(occupant.vote) : "#E5E7EB"}
                                    stroke={occupant ? "#ffffff" : "none"} // High contrast stroke
                                    strokeWidth={1}
                                    style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }} // CSS Transition
                                    role={occupant ? "button" : "presentation"}
                                    tabIndex={occupant ? 0 : -1}
                                    aria-label={occupant ? `${occupant.name}, ${occupant.party}, Głos: ${occupant.vote}` : "Miejsce wolne"}
                                    onMouseEnter={() => occupant && setHoveredMP(occupant)}
                                    onMouseLeave={() => setHoveredMP(null)}
                                    // Keyboard & Click support
                                    onClick={() => occupant?.id && navigate(`/poslowie/${occupant.id}`)}
                                    onKeyDown={(e) => handleKeyDown(e, occupant)}
                                    className={occupant ? "cursor-pointer hover:stroke-neutral-900 dark:hover:stroke-neutral-300 focus:outline-none focus:stroke-blue-500 focus:stroke-2" : ""}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredMP && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-neutral-200 dark:border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 z-10 pointer-events-none min-w-[300px]">
                        {hoveredMP.photo_url ? (
                            <img src={hoveredMP.photo_url} className="w-12 h-12 rounded-full object-cover bg-neutral-100" alt="" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-200" />
                        )}
                        <div>
                            <div className="font-bold text-lg leading-tight text-neutral-900 dark:text-neutral-100">{hoveredMP.name}</div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">{hoveredMP.party}</div>
                        </div>
                        <div className={`ml-auto font-bold px-3 py-1 rounded-lg text-sm
                            ${hoveredMP.vote === 'YES' ? 'bg-green-100 text-green-700' :
                                hoveredMP.vote === 'NO' ? 'bg-red-100 text-red-700' :
                                    hoveredMP.vote === 'ABSTAIN' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-500'
                            }
                        `}>
                            {hoveredMP.vote === 'YES' ? 'ZA' : hoveredMP.vote === 'NO' ? 'PRZECIW' : hoveredMP.vote === 'ABSTAIN' ? 'WSTRZ.' : 'NIEOB.'}
                        </div>
                    </div>
                )}
            </div>

            {/* Overflow Zone (The "Poczekalnia") */}
            {overflowMPs.length > 0 && (
                <div className="w-full max-w-4xl mt-8 px-4">
                    <div className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
                        Posłowie bez przypisanego miejsca / Nowi ({overflowMPs.length})
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center bg-neutral-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-neutral-300 dark:border-slate-700">
                        {overflowMPs.map((mp, idx) => (
                            <div
                                key={idx}
                                role="button"
                                tabIndex={0}
                                aria-label={`${mp.name}, ${mp.party}`}
                                onClick={() => mp.id && navigate(`/poslowie/${mp.id}`)}
                                onKeyDown={(e) => handleKeyDown(e, mp)}
                                onMouseEnter={() => setHoveredMP(mp)}
                                onMouseLeave={() => setHoveredMP(null)}
                                className="w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-neutral-50 focus:ring-blue-500"
                                style={{ backgroundColor: getColor(mp.vote) }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SejmHemicycle;

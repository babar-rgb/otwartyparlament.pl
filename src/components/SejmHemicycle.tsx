import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface MPData {
    name: string;
    party: string;
    photo_url: string;
    vote: string; // 'YES', 'NO', 'ABSTAIN', 'ABSENT'
    id?: number;
}

interface SejmHemicycleProps {
    data: MPData[];
}

// Architecture: Fixed Sejm Layout (Digital Twin)
interface Seat {
    id: number;
    x: number;
    y: number;
}

const generateSejmLayout = (): Seat[] => {
    const seats: Seat[] = [];

    // Config
    const SECTORS_COUNT = 5;
    const ROWS_COUNT = 14;

    // Exact configuration to reach 92 seats per sector (460 total)
    const ROW_CAPACITIES = [4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9];

    // Geometry
    const RADIUS_INNER = 140;
    const RADIUS_OUTER = 460;
    const START_ANGLE = Math.PI * 0.1; // Right limit
    const END_ANGLE = Math.PI * 0.9;   // Left limit
    const TOTAL_SPAN = END_ANGLE - START_ANGLE;

    const AISLE_WIDTH = 0.04;
    const TOTAL_AISLE_SPACE = (SECTORS_COUNT - 1) * AISLE_WIDTH;
    const USABLE_ANGLE = TOTAL_SPAN - TOTAL_AISLE_SPACE;
    const SECTOR_ANGLE = USABLE_ANGLE / SECTORS_COUNT;

    let globalSeatId = 0;

    // Iterate Sectors (Left to Right for ID generation? Or mapping?)
    // Sorted Data is Left-to-Right. So Seat IDs should correspond 0..459 Left-to-Right.
    // So Sector 0 is Leftmost.
    for (let s = 0; s < SECTORS_COUNT; s++) {
        // Sector Start = END_ANGLE - (s * (SECTOR_ANGLE + AISLE_WIDTH))
        const sectorStartAngle = END_ANGLE - (s * (SECTOR_ANGLE + AISLE_WIDTH));

        for (let r = 0; r < ROWS_COUNT; r++) {
            const seatsInRow = ROW_CAPACITIES[r];
            const radius = RADIUS_INNER + (r * (RADIUS_OUTER - RADIUS_INNER) / (ROWS_COUNT - 1));

            // Center within sector
            const angleStep = SECTOR_ANGLE / seatsInRow;

            for (let i = 0; i < seatsInRow; i++) {
                // Angle: Start from High (Left) down to Low (Right) within sector
                // Center of the slot `i`
                const angle = sectorStartAngle - (angleStep / 2) - (i * angleStep);

                const x = radius * Math.cos(angle);
                const y = -radius * Math.sin(angle); // SVG Flip

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

const FIXED_SEATS = generateSejmLayout();

const SejmHemicycle: React.FC<SejmHemicycleProps> = ({ data }) => {
    const navigate = useNavigate();
    const [hoveredMP, setHoveredMP] = useState<MPData | null>(null);

    // 1. Sort MPs Logic
    const sortedMPs = useMemo(() => {
        const partyConfiguration: Record<string, { shortName: string; order: number; color: string }> = {
            "Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PP, Unia Pracy, Inicjatywa Polska)": { shortName: "Lewica", order: 1, color: "#8B0000" },
            "Klub Parlamentarny Koalicja Obywatelska - Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni": { shortName: "KO", order: 2, color: "#DC6A26" },
            "Klub Parlamentarny Polska 2050 - Trzecia Droga": { shortName: "PL2050", order: 3, color: "#F6C102" },
            "Klub Parlamentarny Polskie Stronnictwo Ludowe - Trzecia Droga": { shortName: "PSL", order: 3, color: "#056608" },
            "Klub Parlamentarny Prawo i Sprawiedliwość": { shortName: "PiS", order: 4, color: "#182F57" },
            "Klub Parlamentarny Konfederacja": { shortName: "Konfederacja", order: 5, color: "#0B162A" },
            "Kukiz'15": { shortName: "Kukiz15", order: 4, color: "#000000" },
            "Posłowie Niezrzeszeni": { shortName: "Niezrzeszeni", order: 6, color: "#808080" }
        };

        const getPartyConfig = (clubName: string) => {
            if (clubName.includes("Lewica")) return partyConfiguration["Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PP, Unia Pracy, Inicjatywa Polska)"];
            if (clubName.includes("Koalicja Obywatelska") || clubName.includes("KO")) return partyConfiguration["Klub Parlamentarny Koalicja Obywatelska - Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni"];
            if (clubName.includes("Polska 2050")) return partyConfiguration["Klub Parlamentarny Polska 2050 - Trzecia Droga"];
            if (clubName.includes("PSL") || clubName.includes("Ludowe")) return partyConfiguration["Klub Parlamentarny Polskie Stronnictwo Ludowe - Trzecia Droga"];
            if (clubName.includes("Prawo i Sprawiedliwość") || clubName.includes("PiS")) return partyConfiguration["Klub Parlamentarny Prawo i Sprawiedliwość"];
            if (clubName.includes("Konfederacja")) return partyConfiguration["Klub Parlamentarny Konfederacja"];
            if (clubName.includes("Kukiz")) return partyConfiguration["Kukiz'15"];
            return partyConfiguration["Posłowie Niezrzeszeni"];
        };

        return [...data].sort((a, b) => {
            const configA = getPartyConfig(a.party);
            const configB = getPartyConfig(b.party);
            if (configA.order !== configB.order) return configA.order - configB.order;
            if (a.vote !== b.vote) return a.vote.localeCompare(b.vote);
            return a.name.localeCompare(b.name);
        });
    }, [data]);

    const getColor = (vote: string) => {
        switch (vote) {
            case 'YES': return '#16a34a';
            case 'NO': return '#dc2626';
            case 'ABSTAIN': return '#f59e0b';
            case 'ABSENT': return '#d4d4d8';
            default: return '#e5e7eb';
        }
    };

    return (
        <div className="relative flex justify-center w-full overflow-hidden">
            <svg
                viewBox="-450 -450 900 500"
                className="w-full h-auto max-h-[60vh]"
                style={{ maxWidth: '100%' }}
            >
                {FIXED_SEATS.map((seat) => {
                    // Mapping: Seat ID -> Sorted MP Index
                    // This is "Cinema Seating" - seat 0 gets mp 0.
                    const occupant = sortedMPs[seat.id];

                    return (
                        <motion.circle
                            key={seat.id}
                            cx={seat.x}
                            cy={seat.y}
                            r={6}
                            fill={occupant ? getColor(occupant.vote) : "#E0E0E0"} // Gray if empty
                            stroke="white"
                            strokeWidth={1}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: seat.id * 0.0005, duration: 0.5 }}
                            className={occupant ? "cursor-pointer hover:stroke-neutral-900 dark:hover:stroke-white transition-colors" : ""}
                            onMouseEnter={() => occupant && setHoveredMP(occupant)}
                            onMouseLeave={() => setHoveredMP(null)}
                            onClick={() => {
                                if (occupant && occupant.id) {
                                    navigate(`/poslowie/${occupant.id}`);
                                }
                            }}
                        />
                    );
                })}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredMP && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-neutral-200 dark:border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 z-10 pointer-events-none min-w-[300px]">
                    {hoveredMP.photo_url ? (
                        <img src={hoveredMP.photo_url} className="w-12 h-12 rounded-full object-cover bg-neutral-100" alt={hoveredMP.name} />
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
                        {hoveredMP.vote === 'YES' && 'ZA'}
                        {hoveredMP.vote === 'NO' && 'PRZECIW'}
                        {hoveredMP.vote === 'ABSTAIN' && 'WSTRZ.'}
                        {hoveredMP.vote === 'ABSENT' && 'NIEOB.'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SejmHemicycle;

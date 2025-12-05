import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MPData {
    name: string;
    party: string;
    photo_url: string;
    vote: string; // 'YES', 'NO', 'ABSTAIN', 'ABSENT'
    id?: number; // Optional if we link to profile
}

interface SejmHemicycleProps {
    data: MPData[];
    width?: number;
    height?: number;
}

const ROWS = 12;
const SEATS_TOTAL = 460;
const RADIUS_INNER = 120;
const RADIUS_OUTER = 400;

// Helper to generate seat coordinates
const generateSeats = () => {
    const seats = [];
    const rowStep = (RADIUS_OUTER - RADIUS_INNER) / (ROWS - 1);

    // Initial estimation of seats per row (proportional to radius)
    let tempRows = [];
    let totalCircumference = 0;

    for (let r = 0; r < ROWS; r++) {
        const rad = RADIUS_INNER + r * rowStep;
        totalCircumference += Math.PI * rad;
        tempRows.push({ r, rad });
    }

    // Allocate seats
    let allocated = 0;
    const rowCounts = tempRows.map(row => {
        const count = Math.round((Math.PI * row.rad / totalCircumference) * SEATS_TOTAL);
        return count;
    });

    // Adjustment to match exactly 460
    const currentSum = rowCounts.reduce((a, b) => a + b, 0);
    let diff = SEATS_TOTAL - currentSum;

    // Distribute diff to outer rows
    let i = ROWS - 1;
    while (diff !== 0) {
        if (diff > 0) {
            rowCounts[i]++;
            diff--;
        } else {
            rowCounts[i]--;
            diff++;
        }
        i = (i - 1 + ROWS) % ROWS;
    }

    // Generate Coords
    for (let r = 0; r < ROWS; r++) {
        const radius = RADIUS_INNER + r * rowStep;
        const count = rowCounts[r];
        const angleStep = Math.PI / (count - 1 || 1); // Spread over 180 deg (PI)

        for (let s = 0; s < count; s++) {
            // Angle from PI (left) to 0 (right)
            // But usually we want 0 at top? No, hemicycle is often standard math angle.
            // Let's say Left is 180deg (PI), Right is 0deg.
            const angle = Math.PI - (s * angleStep);

            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle); // y goes UP in math, but SVG y goes DOWN. 
            // We want the arch to curve UPWARDS usually? Or DOWNWARDS?
            // Standard parliament diagrams are usually an arc opening upwards or the speaker is at bottom.
            // Let's assume Speaker is at (0,0) at the bottom center.
            // So y should be negative (upwards) relative to center.

            // Store angle for sorting
            seats.push({ x, y: -y, rotation: (angle * 180 / Math.PI) - 90, angleRaw: angle });
        }
    }

    // CRITICAL FIX: Sort seats by Angle (Left to Right) 
    // to ensure parties fill "Wedges" (Slices) instead of "Rings".
    // Determine sort based on angle. Larger angle (PI) is Left. Smaller (0) is Right.
    // We want to fill Left to Right.
    seats.sort((a, b) => b.angleRaw - a.angleRaw);

    return seats;
};

const SEAT_COORDS = generateSeats();

const SejmHemicycle: React.FC<SejmHemicycleProps> = ({ data, width = 800, height = 500 }) => {
    const [hoveredMP, setHoveredMP] = useState<MPData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // 1. Sort Data by Party (to group colors) or just Party?
    // User mentioned: "Możemy układać posłów partiami ... i kolorować ich decyzje"
    // Standard sorting: Party A, Party B, ...
    // Within party: Vote? To show clusters of dissent? That looks cool.
    const sortedData = useMemo(() => {
        // Clone and sort
        // Map standard API parties to sort order roughly Left-to-Right or size
        // Correct Polish Spectrum (Left to Right)
        const partyOrder: Record<string, number> = {
            'Lewica': 1,
            'Koalicja Obywatelska': 2,
            'Polska 2050 - Trzecia Droga': 3,
            'Polska 2050': 3,
            'Polskie Stronnictwo Ludowe - Trzecia Droga': 4,
            'Polskie Stronnictwo Ludowe': 4,
            'Kukiz\'15': 5,
            'Prawo i Sprawiedliwość': 6,
            'Konfederacja': 7
        };

        return [...data].sort((a, b) => {
            // Clean party name helper
            const getP = (p: string) => {
                if (p.includes('Polska 2050')) return 'Polska 2050';
                if (p.includes('PSL') || p.includes('Ludowe')) return 'Polskie Stronnictwo Ludowe';
                return p;
            };

            const pa = partyOrder[getP(a.party)] || 99;
            const pb = partyOrder[getP(b.party)] || 99;

            if (pa !== pb) return pa - pb;
            // Secondary sort by vote to cluster dissenters
            return a.vote.localeCompare(b.vote);
        });
    }, [data]);

    // Map sorted MPs to Seats
    // Note: If data.length != 460, we act gracefully.
    // If < 460, some seats empty. If > 460, truncate/ignore ??
    // Usually Sejm has 460.

    const getColor = (vote: string) => {
        switch (vote) {
            case 'YES': return '#16a34a'; // green-600
            case 'NO': return '#dc2626'; // red-600
            case 'ABSTAIN': return '#f59e0b'; // amber-500
            case 'ABSENT': return '#d4d4d8'; // zinc-300
            default: return '#e5e7eb';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Update tooltip position relative to SVG or Screen
        // Using simple offset
        // But better to use the seat coordinates if possible, but hover event is easy
    };

    // ViewBox: Center is 0,0. 
    // X goes from -400 to 400. Y goes from -400 to 0. (Plus padding)
    // Let's add padding.

    return (
        <div className="relative flex justify-center w-full overflow-hidden">
            <svg
                viewBox="-450 -450 900 500"
                className="w-full h-auto max-h-[60vh]"
                style={{ maxWidth: '100%' }}
            >
                <AnimatePresence>
                    {sortedData.slice(0, 460).map((mp, idx) => {
                        const seat = SEAT_COORDS[idx];
                        if (!seat) return null;

                        return (
                            <motion.circle
                                key={idx}
                                cx={seat.x}
                                cy={seat.y}
                                r={6}
                                fill={getColor(mp.vote)}
                                stroke="white"
                                strokeWidth={1}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.001, duration: 0.3 }}
                                className="cursor-pointer hover:stroke-neutral-900 dark:hover:stroke-white transition-colors"
                                onMouseEnter={(e) => {
                                    setHoveredMP(mp);
                                    // Get bounding rect for simple positioning logic or just center?
                                    // Actually we will render tooltip outside SVG or using ForeignObject?
                                    // Let's use outside absolute div controlled by state.
                                }}
                                onMouseLeave={() => setHoveredMP(null)}
                            // Link handling would need wrapping or onClick nav
                            />
                        );
                    })}
                </AnimatePresence>

                {/* Labels for "Left" and "Right" sides potentially? Or Legend? */}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredMP && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-neutral-200 dark:border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 z-10 pointer-events-none min-w-[300px]">
                    {hoveredMP.photo_url ? (
                        <img src={hoveredMP.photo_url} className="w-12 h-12 rounded-full object-cover bg-neutral-100" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200" />
                    )}
                    <div>
                        <div className="font-bold text-lg leading-tight">{hoveredMP.name}</div>
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

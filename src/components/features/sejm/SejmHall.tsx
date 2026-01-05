import { useMemo, useState } from 'react';
import { MP } from '../../../api';

interface SejmHallProps {
    votes: {
        mpId: number;
        vote: 'za' | 'przeciw' | 'wstrzymal' | 'nieobecny';
        mp: MP;
    }[];
}

interface Seat {
    id: number;
    x: number;
    y: number;
    angle: number;
}

export default function SejmHall({ votes }: SejmHallProps) {
    const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

    // Generate 460 seats in a semicircle
    const seats = useMemo(() => {
        const generatedSeats: Seat[] = [];
        const rows = 12;
        const totalSeats = 460;

        // Distribution of seats per row (approximate for semicircle)
        // We want more seats in the back rows
        let currentId = 0;

        for (let row = 0; row < rows; row++) {
            const radius = 150 + (row * 25); // Base radius + row spacing
            // Calculate number of seats in this row proportional to radius
            // Circumference = PI * radius (for semicircle)
            // We want roughly equal spacing between seats
            const arcLength = Math.PI * radius;
            const seatSpacing = 20; // approximate spacing
            const seatsInRow = Math.floor(arcLength / seatSpacing);

            const angleStep = Math.PI / (seatsInRow + 1); // +1 for padding on sides

            for (let s = 0; s < seatsInRow; s++) {
                if (currentId >= totalSeats) break;

                // Calculate angle (0 to PI, from left to right)
                // We reverse it to match typical parliament layouts (Left wing on left)
                const angle = Math.PI - (angleStep * (s + 1));

                generatedSeats.push({
                    id: currentId,
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle), // In SVG y goes down, but we want semicircle up? No, usually top-down view.
                    // Let's assume (0,0) is the speaker's podium at bottom center.
                    // So y should be negative to go "up" on screen if (0,0) is bottom.
                    // Or we center the SVG and flip Y.
                    angle: angle
                });
                currentId++;
            }
        }

        // If we didn't fill 460, add remaining to last row or distribute (simplified here)
        return generatedSeats;
    }, []);

    // Sort votes by party to cluster them
    // We want to map the sorted votes to the seats sorted by angle (Left to Right)
    const sortedVotes = useMemo(() => {
        // Define party order (Left to Right spectrum)
        const partyOrder: Record<string, number> = {
            'Lewica': 1,
            'KO': 2,
            'Polska2050': 3,
            'PSL-TD': 4,
            'PiS': 5,
            'Konfederacja': 6,
            'Kukiz15': 7
        };

        return [...votes].sort((a, b) => {
            const orderA = partyOrder[a.mp.club] || 99;
            const orderB = partyOrder[b.mp.club] || 99;
            return orderA - orderB;
        });
    }, [votes]);

    // Map votes to seats
    // We assume seats are already generated somewhat left-to-right layer by layer.
    // To get a true "slice" effect, we should sort seats by angle primarily.
    const mappedSeats = useMemo(() => {
        const sortedSeats = [...seats].sort((a, b) => b.angle - a.angle); // Sort by angle (Left to Right)

        return sortedSeats.map((seat, index) => {
            const voteData = sortedVotes[index];
            return {
                ...seat,
                data: voteData
            };
        });
    }, [seats, sortedVotes]);

    const getColor = (vote: string) => {
        switch (vote) {
            case 'za': return '#10b981'; // green-500
            case 'przeciw': return '#ef4444'; // red-500
            case 'wstrzymal': return '#eab308'; // yellow-500
            case 'nieobecny': return '#94a3b8'; // slate-400
            default: return '#e2e8f0';
        }
    };

    const hoveredData = hoveredSeat !== null ? mappedSeats.find(s => s.id === hoveredSeat)?.data : null;

    return (
        <div className="relative w-full aspect-[2/1] max-w-4xl mx-auto my-8">
            <svg viewBox="-400 -450 800 500" className="w-full h-full drop-shadow-xl">
                {/* Speaker's Podium (Reference) */}
                <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#cbd5e1" />

                {mappedSeats.map((seat) => (
                    <circle
                        key={seat.id}
                        cx={seat.x}
                        cy={-seat.y} // Flip Y to make semicircle go up from origin
                        r={hoveredSeat === seat.id ? 8 : 5}
                        fill={seat.data ? getColor(seat.data.vote) : '#e2e8f0'}
                        className="transition-all duration-200 cursor-pointer hover:opacity-100"
                        style={{ opacity: seat.data ? 1 : 0.3 }}
                        onMouseEnter={() => setHoveredSeat(seat.id)}
                        onMouseLeave={() => setHoveredSeat(null)}
                    />
                ))}
            </svg>

            {/* Tooltip / Info Card */}
            {hoveredData && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-xl border border-slate-200 rounded-xl p-4 flex items-center gap-4 min-w-[300px] animate-in slide-in-from-bottom-2 fade-in">
                    <img
                        src={hoveredData.mp.photo_url || `https://ui-avatars.com/api/?name=${hoveredData.mp.first_name}+${hoveredData.mp.last_name}&background=random`}
                        alt="MP"
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                    />
                    <div>
                        <p className="font-bold text-slate-900">{hoveredData.mp.first_name} {hoveredData.mp.last_name}</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-600">{hoveredData.mp.club}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`font-bold uppercase ${hoveredData.vote === 'za' ? 'text-green-600' :
                                hoveredData.vote === 'przeciw' ? 'text-red-600' :
                                    hoveredData.vote === 'wstrzymal' ? 'text-yellow-600' : 'text-slate-500'
                                }`}>
                                {hoveredData.vote}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs shadow-sm">
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Za</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Przeciw</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Wstrzymał</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Nieobecny</div>
            </div>
        </div>
    );
}

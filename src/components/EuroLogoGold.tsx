import React from 'react';

export const EuroLogoGold = ({ className = "w-20 h-20" }: { className?: string }) => (
    <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Ring of 12 Stars (EU Flag) */}
        <g transform="translate(100, 100)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <g key={i} transform={`rotate(${angle}) translate(0, -80)`}>
                    {/* Star shape */}
                    <path
                        d="M0 -6 L1.5 -1.5 L6 -1.5 L2.5 1.5 L4 6 L0 3 L-4 6 L-2.5 1.5 L-6 -1.5 L-1.5 -1.5 Z"
                        fill="#D6B55E"
                        transform="rotate(0)" // Stars usually point up, but in EU flag they point up relative to the page. 
                    // Creating simplified rotation logic: The stars in EU flag don't rotate with the circle position, they are all upright.
                    // Reset rotation here takes more math. For simplicity let's rotate the group and counter-rotate the star?
                    />
                </g>
            ))}
        </g>

        {/* To fix star rotation (upright), we use absolute coordinates or counter-rotations. 
       Let's use static positions for a clean look or simplified geometric representation. */}

        {/* Re-drawing stars upright */}
        <circle cx="100" cy="20" r="0" fill="none" /> {/* Reference */}

        {/* Element 2: The Chamber (Arcs) */}
        <path d="M60 120 A 40 40 0 0 1 140 120" stroke="#D6B55E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50 120 A 50 50 0 0 1 150 120" stroke="#D6B55E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 120 A 60 60 0 0 1 160 120" stroke="#D6B55E" strokeWidth="1.5" strokeLinecap="round" />

        {/* Stars fixed upright positions roughly on a circle r=80 centered at 100,100 */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 100 + 80 * Math.cos(rad);
            const y = 100 + 80 * Math.sin(rad);
            return (
                <path
                    key={`s-${i}`}
                    d={`M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y - 1.5} L${x + 2.5} ${y + 1.5} L${x + 4} ${y + 6} L${x} ${y + 3} L${x - 4} ${y + 6} L${x - 2.5} ${y + 1.5} L${x - 6} ${y - 1.5} L${x - 1.5} ${y - 1.5} Z`}
                    fill="#D6B55E"
                />
            )
        })}
    </svg>
);

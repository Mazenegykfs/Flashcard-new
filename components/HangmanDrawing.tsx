
import React from 'react';

const Head = <circle cx="140" cy="70" r="20" />;
const Body = <line x1="140" y1="90" x2="140" y2="130" />;
const RightArm = <line x1="140" y1="100" x2="170" y2="120" />;
const LeftArm = <line x1="140" y1="100" x2="110" y2="120" />;
const RightLeg = <line x1="140" y1="130" x2="170" y2="150" />;
const LeftLeg = <line x1="140" y1="130" x2="110" y2="150" />;

const BODY_PARTS = [Head, Body, RightArm, LeftArm, RightLeg, LeftLeg];

interface HangmanDrawingProps {
    numberOfGuesses: number;
}

export const HangmanDrawing: React.FC<HangmanDrawingProps> = ({ numberOfGuesses }) => {
    return (
        <svg viewBox="0 0 200 250" className="w-40 h-52 mx-auto">
            {/* Stand */}
            <line className="hg-part" x1="20" y1="230" x2="100" y2="230" /> 
            <line className="hg-part" x1="60" y1="230" x2="60" y2="20" />
            <line className="hg-part" x1="60" y1="20" x2="140" y2="20" />
            <line className="hg-part" x1="140" y1="20" x2="140" y2="50" />
            {/* Body parts */}
            {BODY_PARTS.slice(0, numberOfGuesses).map((part, index) => (
                <g key={index} className="hg-part">
                    {part}
                </g>
            ))}
            <style>
                {`
                    .hg-part {
                        stroke: #212529;
                        stroke-width: 4;
                        fill: none;
                        stroke-linecap: round;
                    }
                `}
            </style>
        </svg>
    );
}

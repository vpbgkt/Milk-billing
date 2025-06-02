import React from 'react';

interface MilkJugProps {
  fillLevel: number; // 0 to 1 (percentage filled)
  size?: number;
  className?: string;
}

const MilkJug: React.FC<MilkJugProps> = ({ fillLevel, size = 120, className = '' }) => {
  const clampedFillLevel = Math.max(0, Math.min(1, fillLevel));
  const fillHeight = clampedFillLevel * 70; // 70% of jug height is fillable
  
  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Jug Body */}
        <path
          d="M30 25 L30 85 Q30 95 35 100 Q40 105 50 105 L70 105 Q80 105 85 100 Q90 95 90 85 L90 25 Z"
          fill="#f8fafc"
          stroke="#64748b"
          strokeWidth="3"
          rx="5"
        />
        
        {/* Jug Handle */}
        <path
          d="M90 40 Q105 40 105 55 Q105 70 90 70"
          fill="none"
          stroke="#64748b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Jug Spout */}
        <path
          d="M25 25 Q20 20 25 15 L35 15 Q40 15 35 20"
          fill="#f8fafc"
          stroke="#64748b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        
        {/* Milk Fill */}
        {fillHeight > 0 && (
          <path
            d={`M32 ${105 - fillHeight} L32 83 Q32 93 37 98 Q42 103 50 103 L70 103 Q78 103 83 98 Q88 93 88 83 L88 ${105 - fillHeight} Z`}
            fill="#ffffff"
            opacity="0.9"
          />
        )}
        
        {/* Milk Surface (with slight wave effect) */}
        {fillHeight > 5 && (
          <ellipse
            cx="60"
            cy={105 - fillHeight}
            rx="28"
            ry="3"
            fill="#ffffff"
            opacity="0.8"
          />
        )}
        
        {/* Volume Labels */}
        <text
          x="110"
          y="30"
          fill="#64748b"
          fontSize="10"
          textAnchor="start"
          className="font-mono"
        >
          3L
        </text>
        <text
          x="110"
          y="55"
          fill="#64748b"
          fontSize="10"
          textAnchor="start"
          className="font-mono"
        >
          2L
        </text>
        <text
          x="110"
          y="80"
          fill="#64748b"
          fontSize="10"
          textAnchor="start"
          className="font-mono"
        >
          1L
        </text>
        
        {/* Measurement Lines */}
        <line x1="88" y1="30" x2="92" y2="30" stroke="#94a3b8" strokeWidth="1" />
        <line x1="88" y1="55" x2="92" y2="55" stroke="#94a3b8" strokeWidth="1" />
        <line x1="88" y1="80" x2="92" y2="80" stroke="#94a3b8" strokeWidth="1" />
      </svg>
      
      {/* Fill Level Text */}
      <div className="text-center mt-2">
        <span className="text-sm font-medium text-gray-600">
          {(clampedFillLevel * 3).toFixed(1)}L
        </span>
      </div>
    </div>
  );
};

export default MilkJug;

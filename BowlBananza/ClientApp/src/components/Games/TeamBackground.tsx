import React from "react";

type TigerFlameBackgroundProps = {
  /** "tiger" for stripes, "flame" for flame-like shapes */
  variant?: "tiger" | "flame";
  /** Main color of stripes/flames */
  primaryColor?: string;
  /** Secondary accent color used in gradients */
  secondaryColor?: string;
  /** Background base color behind shapes */
  backgroundColor?: string;
  /** Optional className for outer wrapper */
  className?: string;
};

const TigerFlameBackground: React.FC<TigerFlameBackgroundProps> = ({
  variant = "tiger",
  primaryColor = "transparent", // orange
  secondaryColor = "transparent",
  backgroundColor = "transparent",
  className,
}) => {
  const isTiger = variant === "tiger";

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          .tf-bg {
            animation: tfBackgroundPulse 14s ease-in-out infinite alternate;
          }

          .tf-stripe {
            animation: tfWave 12s ease-in-out infinite alternate;
          }

          .tf-flame {
            animation: tfFlicker 6s ease-in-out infinite alternate;
          }

          @keyframes tfBackgroundPulse {
            0% { opacity: 0.85; }
            50% { opacity: 1; }
            100% { opacity: 0.9; }
          }

          @keyframes tfWave {
            0% { transform: translateX(0px); }
            50% { transform: translateX(1.2px); }
            100% { transform: translateX(-1px); }
          }

          @keyframes tfFlicker {
            0%   { transform: translateY(0px) scaleY(1); opacity: 0.7; }
            50%  { transform: translateY(-1.5px) scaleY(1.05); opacity: 1; }
            100% { transform: translateY(0.8px) scaleY(0.98); opacity: 0.8; }
          }
        `}
      </style>

      <defs>
        {/* Soft vignette / glow */}
        <radialGradient id="tfBgGrad" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.25} />
          <stop offset="75%" stopColor={backgroundColor} stopOpacity={0.9} />
          <stop offset="100%" stopColor={backgroundColor} stopOpacity={1} />
        </radialGradient>

        {/* Stripe / flame gradient */}
        <linearGradient id="tfStripeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="40%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#200808" />
        </linearGradient>

        {/* Slight blur + glow */}
        <filter id="tfSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.4 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect
        className="tf-bg"
        x={0}
        y={0}
        width={100}
        height={100}
        fill="url(#tfBgGrad)"
      />

      {isTiger ? (
        <>
          {/* Tiger-like wavy stripes */}
          <path
            className="tf-stripe"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M-5,0
              C 5,20  8,40  2,60
              C -2,75  4,90  10,110
              L 25,110
              C 18,80 15,55 20,30
              C 24,15 20,2 18,-5
              Z
            "
            opacity={0.95}
          />
          <path
            className="tf-stripe"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M18,-10
              C 28,12  32,30  26,52
              C 21,70  26,92  32,115
              L 48,115
              C 43,84 42,58 48,34
              C 53,18 50,3 46,-12
              Z
            "
            opacity={0.9}
          />
          <path
            className="tf-stripe"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M40,-8
              C 52,10  56,32  50,54
              C 44,73  50,95  58,112
              L 75,112
              C 69,85 68,60 73,38
              C 78,20 75,4 70,-10
              Z
            "
            opacity={0.9}
          />
          <path
            className="tf-stripe"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M62,-8
              C 74,12  80,32  76,55
              C 72,75  80,96  88,115
              L 105,115
              C 97,82 96,56 100,34
              C 104,17 100,0 94,-10
              Z
            "
            opacity={0.85}
          />
        </>
      ) : (
        <>
          {/* Flame-like shapes rising from the bottom */}
          <path
            className="tf-flame"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M-5,110
              C 10,95  18,80  16,65
              C 14,50  4,40  10,25
              C 18,10  28,8  34,15
              C 40,22  40,35  38,45
              C 35,60  40,75  48,90
              C 54,100 57,108 60,116
              Z
            "
            opacity={0.92}
          />
          <path
            className="tf-flame"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M20,110
              C 32,96  40,82  42,68
              C 44,54  40,42  42,30
              C 44,16  52,8  60,10
              C 70,13  74,26  72,36
              C 70,48  74,62  80,76
              C 86,88  92,98  98,112
              L 20,112
              Z
            "
            opacity={0.88}
          />
          <path
            className="tf-flame"
            filter="url(#tfSoftGlow)"
            fill="url(#tfStripeGrad)"
            d="
              M45,112
              C 55,100  60,90  62,78
              C 64,65  60,54  60,43
              C 61,30  68,20  77,18
              C 86,16  94,24  96,34
              C 98,44  96,54  94,63
              C 92,75  96,86  102,98
              L 105,112
              Z
            "
            opacity={0.82}
          />
        </>
      )}
    </svg>
  );
};

export default TigerFlameBackground;

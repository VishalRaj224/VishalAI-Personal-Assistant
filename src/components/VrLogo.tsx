import React from "react";

interface VrLogoProps {
  className?: string;
  size?: number | string;
  withGlow?: boolean;
}

export const VrLogo: React.FC<VrLogoProps> = ({
  className = "w-9 h-9",
  size,
  withGlow = true,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={`${className} ${withGlow ? "drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]" : ""} shrink-0`}
      style={size ? { width: size, height: size } : undefined}
      aria-label="VR Crown Logo"
    >
      <defs>
        {/* Background Radial Gradient */}
        <radialGradient id="vrBgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#080e22" />
          <stop offset="65%" stopColor="#03050e" />
          <stop offset="100%" stopColor="#000104" />
        </radialGradient>

        {/* Outer Rim Gradient */}
        <linearGradient id="vrRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="45%" stopColor="#00a2ff" />
          <stop offset="100%" stopColor="#0051ff" />
        </linearGradient>

        {/* Crown & R Gradient */}
        <linearGradient id="vrCyanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* V Silver Metallic Gradient */}
        <linearGradient id="vrSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#f1f5f9" />
          <stop offset="80%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        {/* Orbit Ring Gradient */}
        <linearGradient id="vrOrbitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#00f2fe" stopOpacity="1" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="1" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="vrNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Circular Base */}
      <circle cx="256" cy="256" r="236" fill="url(#vrBgGrad)" />

      {/* Outer Neon Rim */}
      <circle
        cx="256"
        cy="256"
        r="232"
        fill="none"
        stroke="url(#vrRimGrad)"
        strokeWidth="14"
        filter="url(#vrNeonGlow)"
      />
      <circle
        cx="256"
        cy="256"
        r="232"
        fill="none"
        stroke="#00f0ff"
        strokeWidth="3.5"
        strokeOpacity="0.85"
      />

      {/* Back Orbit Section (subtle depth behind monogram) */}
      <path
        d="M 376 276 C 438 248 458 212 422 196 C 386 182 308 206 238 238"
        fill="none"
        stroke="url(#vrOrbitGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      {/* Crown on top of monogram */}
      <g filter="url(#vrNeonGlow)">
        <polygon
          points="202,150 222,116 256,92 290,116 310,150 284,144 256,156 228,144"
          fill="url(#vrCyanBlueGrad)"
        />
        {/* Crown base accent band */}
        <polygon
          points="214,164 256,162 298,164 288,170 256,168 224,170"
          fill="#00e5ff"
        />
      </g>

      {/* Letter V (Metallic Silver/White with clean faceted bevel) */}
      <g id="vr-letter-v">
        {/* Left Wing */}
        <polygon
          points="102,168 166,168 214,352 160,352"
          fill="url(#vrSilverGrad)"
        />
        {/* Surface Highlight */}
        <polygon
          points="136,168 166,168 214,352 196,352"
          fill="#ffffff"
          opacity="0.35"
        />
        {/* Right Wing rising to meet R */}
        <polygon
          points="160,352 214,352 292,214 246,214"
          fill="url(#vrSilverGrad)"
        />
      </g>

      {/* Letter R (Electric Cyan-to-Blue with precision cutouts) */}
      <g id="vr-letter-r" filter="url(#vrNeonGlow)">
        {/* Main Upper Arc & Spine of R */}
        <path
          d="M 226 168 L 334 168 C 380 168 400 192 400 224 C 400 254 374 278 328 278 L 274 278 L 340 198 L 244 198 L 226 168 Z"
          fill="url(#vrCyanBlueGrad)"
        />
        {/* Cutout inside upper loop */}
        <path
          d="M 278 198 L 324 198 C 348 198 364 208 364 222 C 364 236 348 246 324 246 L 300 246 Z"
          fill="#03050e"
        />

        {/* Lower Diagonal Leg */}
        <polygon
          points="276,246 328,246 394,352 344,352"
          fill="url(#vrCyanBlueGrad)"
        />
        <polygon
          points="344,352 394,352 384,352 328,346"
          fill="#38bdf8"
          opacity="0.7"
        />
      </g>

      {/* Front Orbit Planetary Ring (Loops in front with vivid cyan neon light) */}
      <g filter="url(#vrNeonGlow)">
        <path
          d="M 94,308 C 112,336 172,342 248,324 C 328,304 406,258 442,202"
          fill="none"
          stroke="url(#vrOrbitGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Crisp White specular core streak */}
        <path
          d="M 124,314 C 182,336 262,324 332,296"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
};

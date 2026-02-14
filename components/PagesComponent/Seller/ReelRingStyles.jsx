"use client";

const reelRingCss = `
@property --reel-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

/* ── Keyframes ── */
@keyframes reel-border-flow {
  0%   { --reel-angle: 0deg; }
  100% { --reel-angle: 360deg; }
}

/* Entrance: bounce-scale + fade */
@keyframes reel-entrance {
  0% {
    opacity: 0;
    transform: scale(0.55);
    filter: blur(8px);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
    filter: blur(0px);
  }
  72% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
}

/* Entrance flash burst */
@keyframes reel-flash {
  0%   { opacity: 0; transform: scale(0.7); }
  25%  { opacity: 0.85; }
  100% { opacity: 0; transform: scale(1.4); }
}

/* Active breathing glow */
@keyframes reel-breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.55; transform: scale(1.05); }
}

/* ── Bubbles ── */
@keyframes bub-1 {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  12%  { opacity: 1; transform: translate(-6px, -5px) scale(1); }
  75%  { opacity: 0.5; transform: translate(-16px, -30px) scale(0.6); }
  100% { opacity: 0; transform: translate(-20px, -40px) scale(0); }
}
@keyframes bub-2 {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  14%  { opacity: 1; transform: translate(8px, -3px) scale(1); }
  78%  { opacity: 0.4; transform: translate(20px, -28px) scale(0.5); }
  100% { opacity: 0; transform: translate(26px, -38px) scale(0); }
}
@keyframes bub-3 {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  16%  { opacity: 0.9; transform: translate(5px, -7px) scale(1); }
  72%  { opacity: 0.35; transform: translate(12px, -34px) scale(0.45); }
  100% { opacity: 0; transform: translate(14px, -46px) scale(0); }
}
@keyframes bub-4 {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  18%  { opacity: 1; transform: translate(-5px, -8px) scale(1); }
  80%  { opacity: 0.3; transform: translate(-14px, -32px) scale(0.4); }
  100% { opacity: 0; transform: translate(-18px, -44px) scale(0); }
}
@keyframes bub-5 {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  10%  { opacity: 0.8; transform: translate(3px, -6px) scale(1); }
  70%  { opacity: 0.25; transform: translate(8px, -36px) scale(0.35); }
  100% { opacity: 0; transform: translate(10px, -48px) scale(0); }
}

/* ── Outer wrapper ── */
.reel-ring {
  --ring-width: 2.5px;
  --ring-radius: 14px;
  --ring-gap: 1.5px;

  position: relative;
  padding: calc(var(--ring-width) + var(--ring-gap));
  border-radius: var(--ring-radius);
  isolation: isolate;

  animation: reel-entrance 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── Gradient border (flows, not rotates) ── */
.reel-ring::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;

  background: conic-gradient(
    from var(--reel-angle),
    #F7941D 0%,
    #ff5f6d 14%,
    #E1306C 26%,
    #833AB4 42%,
    #5B51D8 56%,
    #405DE6 70%,
    #00c6ff 84%,
    #F7941D 100%
  );

  animation: reel-border-flow 3.5s linear infinite;

  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: var(--ring-width);
}

/* ── Active breathing glow ── */
.reel-ring::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: calc(var(--ring-radius) + 4px);
  z-index: -1;
  pointer-events: none;

  background: conic-gradient(
    from var(--reel-angle),
    transparent 0%,
    rgba(225, 48, 108, 0.4) 20%,
    rgba(131, 58, 180, 0.35) 40%,
    transparent 55%,
    rgba(247, 148, 29, 0.38) 85%,
    transparent 100%
  );

  animation:
    reel-border-flow 3.5s linear infinite,
    reel-breathe 2.4s ease-in-out infinite;
  filter: blur(7px);
}

/* ── Entrance flash burst ── */
.reel-ring-flash {
  position: absolute;
  inset: -4px;
  border-radius: calc(var(--ring-radius) + 4px);
  z-index: 4;
  pointer-events: none;

  border: 2px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 0 16px rgba(225, 48, 108, 0.5),
    0 0 32px rgba(131, 58, 180, 0.25),
    inset 0 0 8px rgba(255, 255, 255, 0.2);

  animation: reel-flash 0.75s ease-out 0.25s both;
}

/* ── Bubble container ── */
.reel-ring-bubbles {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  overflow: visible;
}

.reel-ring-bubbles span {
  position: absolute;
  border-radius: 50%;
  will-change: transform, opacity;
}

/* Bubble 1 — top-left, pink */
.reel-ring-bubbles span:nth-child(1) {
  width: 6px; height: 6px;
  top: 8%; left: 4%;
  background: radial-gradient(circle at 35% 35%, #ffb3d9, #E1306C);
  box-shadow: 0 0 6px rgba(225, 48, 108, 0.6);
  animation: bub-1 3s ease-out 1.5s infinite;
}

/* Bubble 2 — top-right, purple */
.reel-ring-bubbles span:nth-child(2) {
  width: 5px; height: 5px;
  top: 12%; right: 6%;
  background: radial-gradient(circle at 35% 35%, #d4b3ff, #833AB4);
  box-shadow: 0 0 6px rgba(131, 58, 180, 0.6);
  animation: bub-2 3.4s ease-out 2.8s infinite;
}

/* Bubble 3 — right, orange */
.reel-ring-bubbles span:nth-child(3) {
  width: 4px; height: 4px;
  top: 50%; right: 0%;
  background: radial-gradient(circle at 35% 35%, #ffe0a8, #F7941D);
  box-shadow: 0 0 5px rgba(247, 148, 29, 0.6);
  animation: bub-3 3.8s ease-out 4.2s infinite;
}

/* Bubble 4 — left, blue */
.reel-ring-bubbles span:nth-child(4) {
  width: 5px; height: 5px;
  top: 60%; left: 2%;
  background: radial-gradient(circle at 35% 35%, #a8d8ff, #405DE6);
  box-shadow: 0 0 5px rgba(64, 93, 230, 0.6);
  animation: bub-4 3.2s ease-out 5.5s infinite;
}

/* Bubble 5 — bottom-right, cyan */
.reel-ring-bubbles span:nth-child(5) {
  width: 4px; height: 4px;
  bottom: 15%; right: 10%;
  background: radial-gradient(circle at 35% 35%, #a8fff0, #00c6ff);
  box-shadow: 0 0 5px rgba(0, 198, 255, 0.5);
  animation: bub-5 3.6s ease-out 7s infinite;
}

/* ── Inner image container ── */
.reel-ring-inner {
  position: relative;
  z-index: 1;
  border-radius: calc(var(--ring-radius) - var(--ring-width) - var(--ring-gap));
  overflow: hidden;
  background: white;
  transform: translateZ(0);
}

/* ── Circular variant ── */
.reel-ring--circle {
  --ring-radius: 999px;
}

/* ── Size presets ── */
.reel-ring--sm { --ring-width: 2px;   --ring-gap: 1px;   }
.reel-ring--lg { --ring-width: 3px;   --ring-gap: 2px;   }

/* ── Mobile performance mode ── */
@media (pointer: coarse), (max-width: 768px) {
  .reel-ring {
    animation: none;
  }

  .reel-ring::before {
    animation: reel-border-flow 6s linear infinite;
  }

  .reel-ring::after {
    animation: reel-border-flow 6s linear infinite;
    filter: blur(2.5px);
    opacity: 0.42;
  }

  .reel-ring-flash,
  .reel-ring-bubbles {
    display: none !important;
  }
}

/* ── Accessibility ── */
@media (prefers-reduced-motion: reduce) {
  .reel-ring,
  .reel-ring::before,
  .reel-ring::after,
  .reel-ring-flash,
  .reel-ring-bubbles span {
    animation: none !important;
  }
  .reel-ring {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
`;

const ReelRingStyles = () => <style jsx global>{reelRingCss}</style>;

export default ReelRingStyles;

"use client";

const reelRingCss = `
@keyframes reel-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes reel-glow {
  0%, 100% { opacity: 0.34; transform: scale(0.98); }
  50% { opacity: 0.56; transform: scale(1.01); }
}
.reel-ring {
  position: relative;
  padding: 3px;
  border-radius: 16px;
  isolation: isolate;
  will-change: transform;
}
.reel-ring::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(from 120deg, #F7941D, #E1306C, #833AB4, #5B51D8, #405DE6, #F7941D);
  animation: reel-rotate 6.2s linear infinite;
  filter: saturate(1.1);
  z-index: 0;
}
.reel-ring::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: inherit;
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 55%),
    radial-gradient(circle at 70% 70%, rgba(225,48,108,0.32), transparent 60%);
  animation: reel-glow 2.4s ease-in-out infinite;
  opacity: 0.38;
  z-index: 0;
  pointer-events: none;
}
.reel-ring-inner {
  position: relative;
  z-index: 1;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.15);
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .reel-ring::before,
  .reel-ring::after {
    animation: none !important;
  }
}
`;

const ReelRingStyles = () => <style jsx global>{reelRingCss}</style>;

export default ReelRingStyles;

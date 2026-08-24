import React from 'react';
import type { IconProps } from '../types';

/**
 * Puru-branded loading mark rendered by <LoadingIndicatorProgress /> on top
 * of every study load / manifest fetch. Was the OHIF 4-square logo;
 * swapped 2026-08 to match the "puru." wordmark with a bouncing red dot
 * — variant 1e from the Puru Spinner design brief (dark-surface treatment
 * of variant 1b, "best for full-screen app boot / login"). The bounce
 * runs at 0.7s ease-in-out and is the only motion in the mark; the
 * ProgressLoadingBar underneath still handles progress-indicator motion.
 *
 * Font: Comfortaa (loaded via <link> in platform/app/public/html-templates/
 * index.html). Inter is the graceful fallback while Comfortaa is fetching
 * or if the CDN is unreachable.
 *
 * Filename kept as LoadingOHIFMark to avoid patching the upstream Icons
 * registry (Icons.tsx export map) — treat the name as a location fossil.
 *
 * Consumer usage stays the same as the old 4-square:
 *   <Icons.LoadingOHIFMark className="h-12 w-12 text-white" />
 * — the wordmark scales to whatever height the class provides.
 */
export const LoadingOHIFMark = (props: IconProps) => (
  <svg
    viewBox="0 0 200 60"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Loading"
    {...props}
  >
    <style>{`
      @keyframes puru-dot-bounce {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }
      .puru-loader-dot {
        animation: puru-dot-bounce 0.7s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
    `}</style>
    <text
      x="0"
      y="46"
      fontFamily="'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif"
      fontSize="48"
      fontWeight="500"
      fill="#ffffff"
      letterSpacing="-1"
    >
      puru
    </text>
    <text
      className="puru-loader-dot"
      x="140"
      y="46"
      fontFamily="'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif"
      fontSize="48"
      fontWeight="700"
      fill="#e83a3a"
    >
      .
    </text>
  </svg>
);

export default LoadingOHIFMark;

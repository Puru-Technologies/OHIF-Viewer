import React from 'react';

/**
 * Landing page shown at "/" when config.showStudyList = false — the
 * viewer has no study list to render, so this is what greets someone
 * who lands on the bare viewer URL. Prompts them to open the Puru
 * Radiology Console (which has the study list and deep-links here).
 *
 * Rebranded 2026-08 to the "puru viewer." wordmark language matching
 * the header logo + spinner: Comfortaa (loaded via Google Fonts from
 * index.html), lowercase `puru` in white + `viewer` in cyan #009efb +
 * red bouncing dot #e83a3a. Same animated dark background as before
 * (subtle grid + soft glow) since it read well.
 */
const PuruLanding = () => {
  return (
    <div className="absolute flex h-full w-full items-center justify-center bg-black overflow-hidden">
      {/* Subtle animated background grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'gridDrift 20s linear infinite',
          }}
        />
      </div>

      {/* Cyan glow orb — echoes the brand accent */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,158,251,0.18) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{ animation: 'fadeInUp 0.8s ease-out' }}
      >
        {/* Wordmark: puru viewer. (Comfortaa, bouncing red dot) */}
        <div
          className="mb-8"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
            fontFamily:
              "'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif",
            letterSpacing: '-1px',
            fontSize: '64px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
            userSelect: 'none',
          }}
        >
          <span style={{ color: '#ffffff', fontWeight: 500 }}>puru</span>
          <span style={{ color: '#009efb', fontWeight: 500, marginLeft: '0.18em' }}>
            viewer
          </span>
          <span
            style={{
              display: 'inline-block',
              color: '#e83a3a',
              fontWeight: 700,
              animation: 'dotBounce 0.9s ease-in-out infinite',
            }}
          >
            .
          </span>
        </div>

        {/* Divider */}
        <div
          className="mb-6"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.5s both' }}
        >
          <div
            className="h-px w-16 mx-auto"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,158,251,0.7), transparent)',
            }}
          />
        </div>

        {/* Message */}
        <p
          className="text-base text-gray-400 font-light max-w-md leading-relaxed"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.6s both',
            fontFamily:
              "'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif",
          }}
        >
          Please open the{' '}
          <span style={{ color: '#009efb', fontWeight: 500 }}>
            Puru Radiology Console
          </span>{' '}
          to select a study for viewing.
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes gridDrift {
          from { transform: translate(0, 0); }
          to   { transform: translate(60px, 60px); }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
};

export default PuruLanding;

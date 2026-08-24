import React from 'react';

/**
 * Landing page shown at "/" when config.showStudyList = false — the
 * viewer has no study list to render, so this is what greets someone
 * who lands on the bare viewer URL. Prompts them to open the Puru
 * Radiology Console (which has the study list and deep-links here).
 *
 * Rebranded 2026-08 to a two-line product lockup: big centered `puru.`
 * wordmark (Comfortaa, white + bouncing red dot) with "DICOM Viewer"
 * tracked-caps subtitle underneath. Same visual language as the header
 * logo + spinner. Dark bg with subtle animated grid + cyan glow.
 */
const PuruLanding = () => {
  return (
    <div
      className="absolute flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        // Diagonal navy gradient matching puru-online-radiology's login/layout
        // shells — keeps the brand consistent across product landings. Darker
        // corners, subtle cyan-navy mid so the cyan glow orb + `puru.` mark
        // pop with more depth than pure black.
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      }}
    >
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
        {/* Wordmark: puru. — big, Comfortaa, bouncing dot */}
        <div
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
            fontFamily:
              "'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif",
            letterSpacing: '-2px',
            fontSize: 'clamp(72px, 12vw, 128px)',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
            userSelect: 'none',
          }}
        >
          <span style={{ color: '#ffffff', fontWeight: 500 }}>puru</span>
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

        {/* Product subtitle: DICOM Viewer — tracked caps, secondary */}
        <div
          style={{
            marginTop: '18px',
            animation: 'fadeInUp 0.8s ease-out 0.4s both',
            fontFamily:
              "'Comfortaa', 'Inter', ui-rounded, system-ui, -apple-system, sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '0.32em',
            color: '#cfd8e3',
            textTransform: 'uppercase',
          }}
        >
          DICOM Viewer
        </div>

        {/* Divider */}
        <div
          className="mt-8 mb-5"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.55s both' }}
        >
          <div
            className="h-px w-16 mx-auto"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,158,251,0.7), transparent)',
            }}
          />
        </div>

        {/* Prompt */}
        <p
          className="text-base text-gray-400 font-light max-w-md leading-relaxed"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.7s both',
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

      {/* Company mark, tucked bottom-right — reads as a footer credit,
          doesn't compete with the centered product lockup above. */}
      <img
        src="/puru-labs-full-logo-on-dark.svg"
        alt="Puru Labs Private Limited"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '32px',
          width: 'clamp(140px, 14vw, 190px)',
          opacity: 0.55,
          animation: 'fadeInUp 0.8s ease-out 1s both',
        }}
      />

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

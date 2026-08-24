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
        // Deep navy base — matches the brand ink. Aurora glow orbs on top
        // provide life without literal imagery.
        background: '#0a1220',
      }}
    >
      {/* Aurora — two soft cyan orbs at offset corners, slow drift so the
          background feels alive without demanding attention. */}
      <div
        className="absolute rounded-full blur-[140px] pointer-events-none"
        style={{
          width: '520px',
          height: '520px',
          top: '-120px',
          left: '-80px',
          background: 'radial-gradient(circle, rgba(0,158,251,0.28) 0%, transparent 70%)',
          animation: 'auroraDriftA 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-[160px] pointer-events-none"
        style={{
          width: '620px',
          height: '620px',
          bottom: '-160px',
          right: '-120px',
          background: 'radial-gradient(circle, rgba(0,158,251,0.20) 0%, transparent 70%)',
          animation: 'auroraDriftB 18s ease-in-out infinite',
        }}
      />
      {/* Center accent orb, subtle spotlight on the wordmark */}
      <div
        className="absolute rounded-full blur-[120px] pointer-events-none"
        style={{
          width: '340px',
          height: '340px',
          background: 'radial-gradient(circle, rgba(0,158,251,0.14) 0%, transparent 70%)',
          animation: 'pulse 5s ease-in-out infinite',
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{ animation: 'fadeInUp 0.8s ease-out' }}
      >
        {/* Wordmark: puru labs. — big, Comfortaa, cyan accent + bouncing dot */}
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
          <span style={{ color: '#009efb', fontWeight: 500, marginLeft: '0.18em' }}>
            labs
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

      {/* Bottom company mark removed — redundant now that the main
          lockup carries "puru labs." itself. */}

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
        @keyframes auroraDriftA {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(60px, 40px); }
        }
        @keyframes auroraDriftB {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(-50px, -30px); }
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

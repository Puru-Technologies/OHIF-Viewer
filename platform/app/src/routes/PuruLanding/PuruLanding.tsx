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
        // Deep navy — matches the puru-online-radiology palette. The chest-
        // X-ray watermark layer sits on top providing the medical texture.
        background: '#0a1220',
      }}
    >
      {/* Chest-X-ray silhouette watermark — abstract ribcage/spine/heart,
          hand-drawn SVG (not a real patient scan). At 6% opacity it reads
          as a medical texture without competing with the product lockup. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0.06, animation: 'fadeInUp 1.4s ease-out both' }}
      >
        <img
          src="/chest-xray-watermark.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: 'clamp(400px, 55vh, 780px)',
            height: 'auto',
            filter: 'blur(0.4px)',
          }}
        />
      </div>

      {/* Cyan glow orb — echoes the brand accent, sits behind the wordmark */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,158,251,0.15) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
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
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
};

export default PuruLanding;

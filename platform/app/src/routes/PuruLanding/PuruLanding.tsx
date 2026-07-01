import React from 'react';

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

      {/* Animated glow orb */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{ animation: 'fadeInUp 0.8s ease-out' }}
      >
        {/* Logo */}
        <div
          className="mb-8"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 0 30px rgba(59,130,246,0.3)',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span
              className="text-3xl font-bold tracking-wide text-white"
              style={{ letterSpacing: '0.15em' }}
            >
              PURU
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-light text-white mb-3"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}
        >
          DICOM Viewer
        </h1>

        {/* Divider */}
        <div
          className="mb-6"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.5s both' }}
        >
          <div
            className="h-px w-16 mx-auto"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)',
            }}
          />
        </div>

        {/* Message */}
        <p
          className="text-base text-gray-400 font-light max-w-md leading-relaxed"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}
        >
          Please open the{' '}
          <span className="text-blue-400 font-medium">Puru Radiology Console</span>{' '}
          to select a study for viewing.
        </p>

        {/* Decorative dots */}
        <div
          className="mt-10 flex items-center gap-2"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.8s both' }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            style={{ animation: 'dotPulse 2s ease-in-out infinite' }}
          />
          <div
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            style={{ animation: 'dotPulse 2s ease-in-out 0.3s infinite' }}
          />
          <div
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            style={{ animation: 'dotPulse 2s ease-in-out 0.6s infinite' }}
          />
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        @keyframes gridDrift {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(60px, 60px);
          }
        }
        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default PuruLanding;

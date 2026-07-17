import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Report = {
  id: number;
  name?: string;
  status?: string;
  text?: string;
};

type Props = {
  report: Report;
  onClose: () => void;
};

/**
 * Floating card that renders a single approved report over the viewer.
 * Portal to <body> so it escapes the left panel's constrained width.
 * Non-modal — clicking outside doesn't dismiss (avoid accidental close mid-read).
 * ESC key closes.
 */
function ReportViewerOverlay({ report, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 24,
        width: 'min(560px, 42vw)',
        maxHeight: 'calc(100vh - 96px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 8,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid #1e293b',
          background: '#111826',
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: '#e2e8f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={report.name}
        >
          {report.name || 'Report'}
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close report"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#ffffff',
          color: '#0f172a',
          padding: '14px 18px',
          fontSize: 13,
          lineHeight: 1.5,
        }}
        // Report HTML comes from puru-pacs write-document flow — trusted origin.
        dangerouslySetInnerHTML={{
          __html: report.text || '<p style="color:#64748b;">Report body is empty.</p>',
        }}
      />
    </div>,
    document.body
  );
}

export default ReportViewerOverlay;

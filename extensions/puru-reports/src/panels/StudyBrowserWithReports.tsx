import React from 'react';
import { WrappedPanelStudyBrowser } from '@ohif/extension-default';
import CompactReportsList from './CompactReportsList';

/**
 * Vertical composite: default OHIF StudyBrowser on top, compact Reports list
 * below. Used as the left rail for Mode 2 (puru-report) so both live in a
 * single panel tab — the right rail is freed up for the SharePanel.
 *
 * Split defaults to roughly 65% studies / 35% reports because reports are
 * usually 2–3 tiles. If a study accumulates more, the reports section
 * scrolls internally.
 */
function StudyBrowserWithReports(props: any) {
  return (
    <div className="puru-studies-and-reports flex h-full flex-col bg-black">
      <div className="min-h-0 flex-[65]">
        <WrappedPanelStudyBrowser {...props} />
      </div>
      <div className="min-h-0 flex-[35] border-t border-neutral-800">
        <CompactReportsList {...props} />
      </div>
    </div>
  );
}

export default StudyBrowserWithReports;

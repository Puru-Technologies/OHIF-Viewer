import React from 'react';
import { WrappedPanelStudyBrowser } from '@ohif/extension-default';

/**
 * Reuses the default StudyBrowser data + hooks; the wrapping div forces a
 * fixed-height single-row filmstrip. Actual horizontal layout is achieved
 * by hosting this panel via the puru-quick layout, which places the strip
 * above the viewport grid instead of in the side rail.
 */
function CompactSeriesList(props: any) {
  return (
    <div className="puru-compact-series-list flex h-full w-full flex-row items-stretch overflow-x-auto overflow-y-hidden bg-black">
      <WrappedPanelStudyBrowser {...props} />
    </div>
  );
}

export default CompactSeriesList;

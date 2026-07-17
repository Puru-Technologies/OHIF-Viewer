import React from 'react';
import ReportsPanel from './panels/ReportsPanel';
import CompactSeriesList from './panels/CompactSeriesList';
import StudyBrowserWithReports from './panels/StudyBrowserWithReports';
import SharePanel from './panels/SharePanel';

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrap = Component => props => (
    <Component
      {...props}
      commandsManager={commandsManager}
      extensionManager={extensionManager}
      servicesManager={servicesManager}
    />
  );

  return [
    // Mode 2 (puru-report) left panel — studies on top, reports below.
    {
      name: 'studyBrowserWithReports',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: 'Studies & Reports',
      component: wrap(StudyBrowserWithReports),
    },
    // Mode 2 (puru-report) right panel — direct URLs + WhatsApp/email hand-off.
    {
      name: 'sharePanel',
      iconName: 'tab-studies',
      iconLabel: 'Share',
      label: 'Share',
      component: wrap(SharePanel),
    },
    // Kept for backwards compatibility / potential reuse; no mode currently
    // references reportsPanel directly (its list+detail lives inside
    // studyBrowserWithReports now).
    {
      name: 'reportsPanel',
      iconName: 'tab-studies',
      iconLabel: 'Reports',
      label: 'Reports',
      component: wrap(ReportsPanel),
    },
    // Mode 1 (puru-quick) — horizontal filmstrip via PuruQuickLayout.
    {
      name: 'compactSeriesList',
      iconName: 'tab-studies',
      iconLabel: 'Series',
      label: 'Series',
      component: wrap(CompactSeriesList),
    },
  ];
}

export default getPanelModule;

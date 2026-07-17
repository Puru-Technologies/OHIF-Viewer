import { utils } from '@ohif/core';
import update from 'immutability-helper';
import {
  ohif,
  cornerstone,
  dicomvideo,
  dicomsr,
  dicompdf,
  dicomSeg,
  dicomPmap,
  dicomRT,
  sopClassHandlers,
  extensionDependencies as basicExtensionDependencies,
  isValidMode,
  onModeEnter,
  onModeExit,
  toolbarSections,
  toolbarButtons,
  NON_IMAGE_MODALITIES,
} from '@ohif/mode-basic';
import { id } from './id';

const { structuredCloneWithFunctions } = utils;

const puruReports = {
  studyBrowserWithReports: '@ohif/extension-puru-reports.panelModule.studyBrowserWithReports',
  sharePanel: '@ohif/extension-puru-reports.panelModule.sharePanel',
};

export const extensionDependencies = {
  ...basicExtensionDependencies,
  '@ohif/extension-puru-reports': '^0.0.1',
};

export const layoutInstance = {
  id: ohif.layout,
  props: {
    // Left rail: composite panel — StudyBrowser on top, Reports list below.
    // Right rail: Share panel with direct viewer URLs + WhatsApp/email hand-off.
    leftPanels: [puruReports.studyBrowserWithReports],
    leftPanelResizable: true,
    rightPanels: [puruReports.sharePanel],
    rightPanelClosed: false,
    rightPanelResizable: true,
    rightPanelInitialExpandedWidth: 320,
    viewports: [
      {
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [
          ohif.sopClassHandler,
          dicomvideo.sopClassHandler,
          ohif.wsiSopClassHandler,
        ],
      },
      {
        namespace: dicomsr.viewport,
        displaySetsToDisplay: [dicomsr.sopClassHandler, dicomsr.sopClassHandler3D],
      },
      {
        namespace: dicompdf.viewport,
        displaySetsToDisplay: [dicompdf.sopClassHandler],
      },
      {
        namespace: dicomSeg.viewport,
        displaySetsToDisplay: [dicomSeg.sopClassHandler],
      },
      {
        namespace: dicomPmap.viewport,
        displaySetsToDisplay: [dicomPmap.sopClassHandler],
      },
      {
        namespace: dicomRT.viewport,
        displaySetsToDisplay: [dicomRT.sopClassHandler],
      },
    ],
  },
};

function layoutTemplate() {
  return structuredCloneWithFunctions(this.layoutInstance);
}

// routeName 'viewer' — same URL slot upstream OHIF longitudinal mode uses.
// This mode replaces longitudinal (unregistered in pluginImports.js) so the
// external HIS URL contract stays intact:
//   http://<viewer>:3000/viewer?StudyInstanceUIDs=<uid>
//   http://<viewer>:3000/viewer?accessionNumber=<X>   (via PuruStudyLauncher)
//   http://<viewer>:3000/viewer?uhid=<X>              (via PuruStudyLauncher)
// All three now land in Mode 2 with the Reports panel already open.
const route = {
  path: 'viewer',
  layoutTemplate,
  layoutInstance,
};

export const modeInstance = {
  id,
  routeName: 'viewer',
  hide: true,
  displayName: 'Puru Report View',
  _activatePanelTriggersSubscriptions: [],
  toolbarSections,
  onModeEnter,
  onModeExit,
  validationTags: { study: [], series: [] },
  isValidMode,
  routes: [route],
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  sopClassHandlers,
  toolbarButtons,
  enableSegmentationEdit: false,
  nonModeModalities: NON_IMAGE_MODALITIES,
};

export function modeFactory({ modeConfiguration }) {
  let instance = this.modeInstance;
  if (modeConfiguration) {
    instance = update(instance, modeConfiguration);
  }
  return instance;
}

const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
};

export default mode;

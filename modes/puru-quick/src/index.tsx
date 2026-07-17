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
  layout: '@ohif/extension-puru-reports.layoutTemplateModule.puruQuickLayout',
  compactSeriesList: '@ohif/extension-puru-reports.panelModule.compactSeriesList',
};

export const extensionDependencies = {
  ...basicExtensionDependencies,
  '@ohif/extension-puru-reports': '^0.0.1',
};

export const layoutInstance = {
  id: puruReports.layout,
  props: {
    leftPanels: [puruReports.compactSeriesList],
    leftPanelResizable: false,
    rightPanels: [],
    rightPanelClosed: true,
    rightPanelResizable: false,
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

const route = {
  path: 'puru-quick',
  layoutTemplate,
  layoutInstance,
};

export const modeInstance = {
  id,
  routeName: 'puru-quick',
  hide: true,
  displayName: 'Puru Quick View',
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

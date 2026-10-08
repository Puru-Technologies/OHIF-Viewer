/** @type {AppTypes.Config} */

/*
 * PACS Ace embedded viewer config.
 *
 * Served by PACS Ace (Spring) under the /viewer-app/ subpath on the hospital
 * LAN, with NO internet access assumed. Opened as:
 *   /viewer-app/puru-quick/dicomjson?url=<manifest url>
 *
 * Build (see scripts/puru-ace-postbuild.mjs for the full recipe):
 *   APP_CONFIG=config/puru-ace.js PUBLIC_URL=/viewer-app/ NODE_ENV=production yarn build
 *   node scripts/puru-ace-postbuild.mjs
 *
 * Rules for this file: no absolute external URLs, no data source other than
 * dicomjson. Asset paths are built from window.PUBLIC_URL so they follow the
 * subpath.
 */
window.config = {
  name: 'config/puru-ace.js',
  routerBasename: '/viewer-app',
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      var base = window.PUBLIC_URL || '/';
      return React.createElement(
        'a',
        { href: base },
        React.createElement('img', {
          src: base + 'puru-logo.svg',
          className: 'h-8',
          alt: 'Puru Labs DICOM Viewer',
        })
      );
    },
  },
  investigationalUseDialog: {
    option: 'never',
  },
  extensions: [],
  modes: [],
  customizationService: {},
  showStudyList: false,
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 3,
  // Manifest + DICOM files are served same-origin by PACS Ace.
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 25,
  },
  showErrorDetails: 'always',
  defaultDataSourceName: 'dicomjson',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
  ],
  httpErrorHandler: error => {
    console.warn(error.status);
  },
};

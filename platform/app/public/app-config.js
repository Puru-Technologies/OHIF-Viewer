window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: false,
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'Local PACS',
        name: 'json',
      },
    },
  ],
  defaultDataSourceName: 'dicomjson',
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'a',
        { href: '/' },
        React.createElement('img', {
          src: '/puru-logo.svg',
          className: 'h-8',
          alt: 'Puru Labs DICOM Viewer',
        })
      );
    },
  },
  investigationalUseDialog: {
    option: 'never',
  },
  customizationService: {},
};

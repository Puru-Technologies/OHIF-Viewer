window.config = {
  routerBasename: '/',
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
          alt: 'Puru DICOM Viewer',
        })
      );
    },
  },
  customizationService: {
    'viewportOverlay.topLeft': {
      id: 'viewportOverlay.topLeft',
      items: [
        {
          id: 'PatientNameOverlay',
          customizationType: 'ohif.overlayItem',
          label: '',
          color: 'white',
          condition: function (props) {
            return props.instance && props.instance.PatientName;
          },
          contentF: function (props) {
            var pn = props.instance.PatientName;
            return typeof pn === 'object' ? pn.Alphabetic || '' : pn || '';
          },
        },
        {
          id: 'PatientIDOverlay',
          customizationType: 'ohif.overlayItem',
          attribute: 'PatientID',
          label: 'ID:',
          color: 'white',
          condition: function (props) {
            return props.instance && props.instance.PatientID;
          },
        },
        {
          id: 'StudyDateOverlay',
          customizationType: 'ohif.overlayItem',
          attribute: 'StudyDate',
          label: '',
          color: 'white',
          condition: function (props) {
            return props.instance && props.instance.StudyDate;
          },
        },
      ],
    },
  },
};

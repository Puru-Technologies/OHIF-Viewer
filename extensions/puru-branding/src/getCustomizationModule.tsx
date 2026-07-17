import PuruAboutModal from './PuruAboutModal';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        'ohif.aboutModal': PuruAboutModal,
      },
    },
  ];
}

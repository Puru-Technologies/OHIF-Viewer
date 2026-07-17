import PuruQuickLayout from './layouts/PuruQuickLayout';

export default function ({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function PuruQuickLayoutWithServices(props) {
    return PuruQuickLayout({
      servicesManager,
      extensionManager,
      commandsManager,
      hotkeysManager,
      ...props,
    });
  }

  return [
    {
      name: 'puruQuickLayout',
      id: 'puruQuickLayout',
      component: PuruQuickLayoutWithServices,
    },
  ];
}

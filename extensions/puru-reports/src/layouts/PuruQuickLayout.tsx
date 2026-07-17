import React, { useEffect, useState, useCallback } from 'react';
import { HangingProtocolService } from '@ohif/core';
import { useAppConfig } from '@state';
import { InvestigationalUseDialog, Onboarding } from '@ohif/ui-next';
import { ViewerHeader } from '@ohif/extension-default';

/**
 * Compact viewer layout for the puru-quick mode. Same header as the default
 * viewer, but replaces the side-rail SidePanel with a fixed-height horizontal
 * filmstrip above the viewport grid — so the series area occupies one row.
 *
 * The filmstrip is rendered by the left-panel component wired in the mode
 * (see @ohif/extension-puru-reports.panelModule.compactSeriesList). If no
 * left panel is registered, the strip is omitted and the grid fills the space.
 */

const FILMSTRIP_HEIGHT = 128;

function PuruQuickLayout({
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  viewports,
  ViewportGridComp,
}: withAppTypes): React.FunctionComponent {
  const [appConfig] = useAppConfig();
  const { panelService, hangingProtocolService, customizationService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const hasLeftPanels = useCallback(
    (): boolean => !!panelService.getPanels('left').length,
    [panelService]
  );
  const [strip, setStrip] = useState(hasLeftPanels());

  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(panelService.EVENTS.PANELS_CHANGED, () => {
      setStrip(hasLeftPanels());
    });
    return () => unsubscribe();
  }, [panelService, hasLeftPanels]);

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('bg-black');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => setShowLoadingIndicator(false)
    );
    return () => unsubscribe();
  }, [hangingProtocolService]);

  const getComponent = (id: string) => {
    const entry = extensionManager.getModuleEntry(id);
    if (!entry || !entry.component) {
      throw new Error(
        `${id} is not a valid module entry — check the mode's extension dependencies.`
      );
    }
    return entry;
  };

  const viewportComponents = viewports.map((v: any) => {
    const entry = getComponent(v.namespace);
    return {
      component: entry.component,
      isReferenceViewable: entry.isReferenceViewable,
      displaySetsToDisplay: v.displaySetsToDisplay,
    };
  });

  const leftPanels = panelService.getPanels('left');
  const StripPanel = strip && leftPanels[0] ? getComponent(leftPanels[0].id).component : null;

  return (
    <div>
      <ViewerHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div
        className="relative flex w-full flex-col overflow-hidden bg-black"
        style={{ height: 'calc(100vh - 52px)' }}
      >
        {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-black" />}
        {StripPanel && (
          <div
            className="border-b border-neutral-800 bg-black"
            style={{ height: FILMSTRIP_HEIGHT, minHeight: FILMSTRIP_HEIGHT }}
          >
            <StripPanel servicesManager={servicesManager} />
          </div>
        )}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          <ViewportGridComp
            servicesManager={servicesManager}
            viewportComponents={viewportComponents}
            commandsManager={commandsManager}
          />
        </div>
      </div>
      <Onboarding tours={customizationService.getCustomization('ohif.tours')} />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
    </div>
  );
}

export default PuruQuickLayout;

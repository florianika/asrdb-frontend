import MapView from '@arcgis/core/views/MapView';
import WebMap from '@arcgis/core/WebMap';
import Popup from '@arcgis/core/widgets/Popup';
import Legend from '@arcgis/core/widgets/Legend';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import LOD from '@arcgis/core/layers/support/LOD';
import { OSM_BASEMAP } from './custom-map-logic/BasemapTypes';
import { BasemapInput, CleanupCallback, MapLayer } from './map-types';
import { WmtsCapabilitiesService } from './wmts-capabilities.service';

export type MapSessionOptions = {
  basemap?: BasemapInput;
  enableLegend?: boolean;
  initialZoom?: number;
  dockPopup?: boolean;
};

export function createWebMap(
  basemap: BasemapInput | undefined,
  layers: MapLayer[]
) {
  return new WebMap({
    basemap: basemap ?? OSM_BASEMAP, // OSM_BASEMAP can be passed here
    layers,
    applicationProperties: {
      viewing: { search: { enabled: true } },
    },
  });
}

export function createMapView(
  container: string | HTMLDivElement,
  webmap: WebMap,
  options: Omit<MapSessionOptions, 'basemap'> = {}
): MapView {
  const view = new MapView({
    container,
    map: webmap,
    spatialReference: { wkid: 3857 },
    ...(options.initialZoom === undefined ? {} : { zoom: options.initialZoom }),
    ...(options.dockPopup
      ? {
          popup: new Popup({
            dockEnabled: true,
            dockOptions: {
              buttonEnabled: false,
              breakpoint: false,
              position: 'top-left',
            },
            visibleElements: { closeButton: false },
          }),
        }
      : {}),
  });

  if (options.enableLegend) {
    const legend = new Legend({ view, visible: true });
    view.ui.add(legend, 'bottom-right');
  }

  return view;
}

export function createMapSession(
  container: string | HTMLDivElement,
  layers: MapLayer[],
  options: MapSessionOptions = {}
): { webmap: WebMap; view: MapView } {
  const webmap = createWebMap(options.basemap, layers);
  return {
    webmap,
    view: createMapView(container, webmap, options),
  };
}

export async function configureWmtsConstraints(
  view: MapView,
  wmtsCapabilitiesService: WmtsCapabilitiesService,
  defaultMaxZoomHide = 15
): Promise<number> {
  const wmtsLayer = view.map?.basemap?.baseLayers.find(
    layer => layer instanceof WMTSLayer
  ) as WMTSLayer | undefined;
  if (!wmtsLayer) {
    return defaultMaxZoomHide;
  }

  const lods = await wmtsCapabilitiesService.getLODs(wmtsLayer.url);
  if (!lods.length) {
    return defaultMaxZoomHide;
  }

  view.constraints = { lods: lods as LOD[] };
  const maxZoom = lods[lods.length - 1].level + 1;
  return Math.floor(maxZoom / 2);
}

export function destroyMapSession(
  view: MapView | undefined,
  cleanupCallbacks: CleanupCallback[]
): void {
  cleanupCallbacks.splice(0).forEach(cleanup => cleanup());
  view?.destroy();
}

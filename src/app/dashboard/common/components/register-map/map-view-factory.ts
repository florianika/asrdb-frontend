import MapView from '@arcgis/core/views/MapView';
import WebMap from '@arcgis/core/WebMap';
import Popup from '@arcgis/core/widgets/Popup';
import Legend from '@arcgis/core/widgets/Legend';
import { OSM_BASEMAP } from './custom-map-logic/BasemapTypes';
import { BasemapInput, MapLayer } from './map-types';

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
  enableLegend = false
): MapView {
  const view = new MapView({
    container,
    map: webmap,
    zoom: 15,
    popup: new Popup({
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: false,
        breakpoint: false,
        position: 'top-left',
      },
      visibleElements: { closeButton: false },
    }),
  });

  if (enableLegend) {
    const legend = new Legend({ view, visible: true });
    view.ui.add(legend, 'bottom-right');
  }

  return view;
}

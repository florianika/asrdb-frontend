import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup';
import { Injectable } from '@angular/core';
import {
  MAP_2025,
  HYBRID_BASEMAP,
  OSM_BASEMAP,
  MAP_2007,
  MAP_2015_2017,
  MAP_2023,
  MAP_2024,
} from './BasemapTypes';
import Basemap from '@arcgis/core/Basemap';
import { BasemapInput, CleanupCallback } from '../map-types';

type BasemapChangeCallback = (basemap: BasemapInput) => void;

@Injectable()
export class BaseMapChangeService {
  async createBasemapChangeAction(
    view: MapView,
    webmapCallback: BasemapChangeCallback,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const basemap = this.createBasemapButton();
    const popup = await this.createPopupForBasemapChange(
      webmapCallback,
      eventsCleanupCallbacks
    );
    this.registerBasemapEventListener(popup, basemap, eventsCleanupCallbacks);

    view.ui.add(basemap, 'top-left');
    view.ui.add(popup);
  }

  private async createPopupForBasemapChange(
    webmapCallback: BasemapChangeCallback,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const popup = new Popup({
      title: $localize`Change base map`,
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: false,
        breakpoint: false,
      },
      visibleElements: {
        closeButton: true,
      },
    });
    popup.content = await this.createPopupContent(
      webmapCallback,
      popup,
      eventsCleanupCallbacks
    );
    return popup;
  }

  private registerBasemapEventListener(
    popup: Popup,
    basemap: HTMLDivElement,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const basemapEventListener = () => {
      popup.open();
    };
    basemap.addEventListener('click', basemapEventListener);
    eventsCleanupCallbacks.push(() => {
      basemap.removeEventListener('click', basemapEventListener);
    });
  }

  private async createPopupContent(
    webmapCallback: BasemapChangeCallback,
    popup: Popup,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const popupContent = document.createElement('div');
    popupContent.style.width = '100%';
    popupContent.style.height = '100%';

    const hybridMap = this.createHybridMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks
    );
    const osmMap = this.createOsmMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks
    );
    const customMap2007 = await this.createCustomMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks,
      MAP_2007
    );
    const customMap2015To2017 = await this.createCustomMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks,
      MAP_2015_2017
    );
    const customMap2025 = await this.createCustomMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks,
      MAP_2025
    );
    const customMap2024 = await this.createCustomMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks,
      MAP_2024
    );
    const customMap2023 = await this.createCustomMapItem(
      webmapCallback,
      popup,
      eventsCleanupCallbacks,
      MAP_2023
    );

    popupContent.appendChild(hybridMap);
    popupContent.appendChild(osmMap);
    popupContent.appendChild(customMap2007);
    popupContent.appendChild(customMap2015To2017);
    popupContent.appendChild(customMap2023);
    popupContent.appendChild(customMap2024);
    popupContent.appendChild(customMap2025);
    return popupContent;
  }

  private createOsmMapItem(
    webmapCallback: BasemapChangeCallback,
    popup: Popup,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const osmMap = document.createElement('div');
    osmMap.id = 'basemap-osm-selection';
    osmMap.className = 'esri-widget esri-interactive basemap-item';

    const popupContentSpanIcon2 = document.createElement('span');
    popupContentSpanIcon2.className = 'esri-icon-basemap';

    const popupContentSpan2 = document.createElement('span');
    popupContentSpan2.textContent = $localize`OSM map`;
    popupContentSpan2.className = 'basemap-type-item';

    osmMap.appendChild(popupContentSpanIcon2);
    osmMap.appendChild(popupContentSpan2);

    const osmMapEventListener = () => {
      webmapCallback(OSM_BASEMAP);
      popup.close();
    };
    osmMap.addEventListener('click', osmMapEventListener);
    eventsCleanupCallbacks.push(() => {
      osmMap.removeEventListener('click', osmMapEventListener);
    });
    return osmMap;
  }

  private createHybridMapItem(
    webmapCallback: BasemapChangeCallback,
    popup: Popup,
    eventsCleanupCallbacks: CleanupCallback[]
  ) {
    const hybridMap = document.createElement('div');
    hybridMap.id = 'basemap-hybrid-selection';
    hybridMap.className = 'esri-widget esri-interactive basemap-item';

    const popupContentSpanIcon = document.createElement('span');
    popupContentSpanIcon.className = 'esri-icon-basemap';

    const popupContentSpan = document.createElement('span');
    popupContentSpan.textContent = $localize`Hybrid map`;
    popupContentSpan.className = 'basemap-type-item';

    hybridMap.appendChild(popupContentSpanIcon);
    hybridMap.appendChild(popupContentSpan);

    const hybridMapEventListener = () => {
      webmapCallback(HYBRID_BASEMAP);
      popup.close();
    };
    hybridMap.addEventListener('click', hybridMapEventListener);
    eventsCleanupCallbacks.push(() => {
      hybridMap.removeEventListener('click', hybridMapEventListener);
    });
    return hybridMap;
  }

  private async createCustomMapItem(
    webmapCallback: BasemapChangeCallback,
    popup: Popup,
    eventsCleanupCallbacks: CleanupCallback[],
    basemap: Basemap
  ) {
    const customMap = document.createElement('div');
    customMap.id = 'basemap-custom-selection-' + basemap.title;
    customMap.className = 'esri-widget esri-interactive basemap-item';

    const popupContentSpanIcon = document.createElement('span');
    popupContentSpanIcon.className = 'esri-icon-basemap';

    const popupContentSpan = document.createElement('span');
    popupContentSpan.textContent = basemap.title;
    popupContentSpan.className = 'basemap-type-item';

    customMap.appendChild(popupContentSpanIcon);
    customMap.appendChild(popupContentSpan);

    const customMapEventListener = () => {
      webmapCallback(basemap);
      popup.close();
    };
    customMap.addEventListener('click', customMapEventListener);
    eventsCleanupCallbacks.push(() => {
      customMap.removeEventListener('click', customMapEventListener);
    });
    return customMap;
  }

  private createBasemapButton() {
    const basemap = document.createElement('div');
    const span = document.createElement('span');
    basemap.id = 'basemap-selection';
    basemap.className =
      'esri-widget esri-widget--button esri-widget esri-interactive';
    basemap.title = $localize`Change map type`;
    span.className = 'esri-icon-basemap';
    basemap.appendChild(span);
    return basemap;
  }
}

import WebMap from "@arcgis/core/WebMap";
import MapView from '@arcgis/core/views/MapView';
import Popup from "@arcgis/core/widgets/Popup";
import {Injectable} from "@angular/core";

@Injectable()
export class BaseMapChangeService {
   createBasemapChangeAction(view: MapView, webmap: WebMap, eventsCleanupCallbacks: any[]) {
    const basemap = this.createBasemapButton();
    const popup = this.createPopupForBasemapChange(webmap, eventsCleanupCallbacks);
    this.registerBasemapEventListener(popup, basemap, eventsCleanupCallbacks);

    view.ui.add(basemap, "top-left");
    view.ui.add(popup);
  }

  private createPopupForBasemapChange(webmap: WebMap, eventsCleanupCallbacks: any[]) {
    const popup = new Popup({
      title: "Change base map",
      dockEnabled: true,
      dockOptions: {
        // Disables the dock button from the popup
        buttonEnabled: false,
        // Ignore the default sizes that trigger responsive docking
        breakpoint: false
      },
      visibleElements: {
        closeButton: true
      }
    });
    popup.content = this.createPopupContent(webmap, popup, eventsCleanupCallbacks);
    return popup;
  }

  private registerBasemapEventListener(popup: Popup, basemap: HTMLDivElement, eventsCleanupCallbacks: any[]) {
    const basemapEventListener = () => {
      popup.open();
    };
    basemap.addEventListener('click', basemapEventListener);
    eventsCleanupCallbacks.push(() => {
      basemap.removeEventListener('click', basemapEventListener);
    });
  }

  private createPopupContent(webmap: WebMap, popup: Popup, eventsCleanupCallbacks: any[]) {
    const popupContent = document.createElement('div');
    popupContent.style.width = "100%";
    popupContent.style.height = "100%";

    const hybridMap = this.createHybridMapItem(webmap, popup, eventsCleanupCallbacks);
    const osmMap = this.createOsmMapItem(webmap, popup, eventsCleanupCallbacks);

    popupContent.appendChild(hybridMap);
    popupContent.appendChild(osmMap);
    return popupContent;
  }

  private createOsmMapItem(webmap: WebMap, popup: Popup, eventsCleanupCallbacks: any[]) {
    const osmMap = document.createElement('div');
    osmMap.id = "basemap-osm-selection";
    osmMap.className = "esri-widget esri-interactive basemap-item";
    const popupContentSpanIcon2 = document.createElement('span');
    popupContentSpanIcon2.className = "esri-icon-basemap";
    const popupContentSpan2 = document.createElement('span');
    popupContentSpan2.textContent = "OSM map";
    popupContentSpan2.className = "basemap-type-item"
    osmMap.appendChild(popupContentSpanIcon2);
    osmMap.appendChild(popupContentSpan2);
    const osmMapEventListener = () => {
      webmap.basemap = 'osm' as any;
      popup.close();
    };
    osmMap.addEventListener('click', osmMapEventListener);
    eventsCleanupCallbacks.push(() => {
      osmMap.removeEventListener('click', osmMapEventListener);
    });
    return osmMap;
  }

  private createHybridMapItem(webmap: WebMap, popup: Popup, eventsCleanupCallbacks: any[]) {
    const hybridMap = document.createElement('div');
    hybridMap.id = "basemap-hybrid-selection";
    hybridMap.className = "esri-widget esri-interactive basemap-item";
    const popupContentSpanIcon = document.createElement('span');
    popupContentSpanIcon.className = "esri-icon-basemap";
    const popupContentSpan = document.createElement('span');
    popupContentSpan.textContent = "Hybrid map";
    popupContentSpan.className = "basemap-type-item"
    hybridMap.appendChild(popupContentSpanIcon);
    hybridMap.appendChild(popupContentSpan);
    const hybridMapEventListener = () => {
      webmap.basemap = 'hybrid' as any;
      popup.close();
    };
    hybridMap.addEventListener('click', hybridMapEventListener);
    eventsCleanupCallbacks.push(() => {
      hybridMap.removeEventListener('click', hybridMapEventListener);
    });
    return hybridMap;
  }

  private createBasemapButton() {
    const basemap = document.createElement('div');
    const span = document.createElement('span');
    basemap.id = "basemap-selection";
    basemap.className = "esri-widget esri-widget--button esri-widget esri-interactive";
    basemap.title = 'Change map type';
    span.className = "esri-icon-basemap";
    basemap.appendChild(span);
    return basemap;
  }
}

import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';

export class MapInteractionService {
  static addZoomWatcher(
    view: MapView,
    buildingLayer: FeatureLayer,
    entranceLayer: FeatureLayer,
    getTotalResults: () => number | null,
    onZoomChange?: (zoom: number) => void
  ) {
    return view.watch('zoom', (zoom) => {
      const totalResults = getTotalResults();
      const lessThan10000 = totalResults && totalResults < 10000;
      if (zoom < 15 && !lessThan10000) {
        buildingLayer.visible = false;
        entranceLayer.visible = false;
      } else {
        buildingLayer.visible = true;
        entranceLayer.visible = true;
      }
      if (onZoomChange) onZoomChange(zoom);
    });
  }

  static addPopupHandler(view: MapView, registerFilterService: RegisterFilterService) {
    return view.on('click', () => {
      setTimeout(() => {
        const popup = view.popup;
        if (!popup?.selectedFeature) return;

        const layerTitle = popup.selectedFeature.layer?.title;
        if (layerTitle === 'ASRDB Buildings') {
          registerFilterService.setBuildingGlobalIdFilter(popup.selectedFeature.attributes['GlobalID']);
        }
        if (layerTitle === 'ASRDB Entrances') {
          registerFilterService.setBuildingGlobalIdFilter(popup.selectedFeature.attributes['EntBldGlobalID']);
        }

        if (popup) popup.close();
      }, 50);
    });
  }
}

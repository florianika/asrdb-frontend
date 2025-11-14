import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import { whenOnce } from "@arcgis/core/core/reactiveUtils";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";

export class LayerFilterService {
  static async filterFeatureLayer(layer: FeatureLayer, view: MapView, where: string) {
    // Server-side filtering using definitionExpression
    layer.definitionExpression = where;

    const layerView = await view.whenLayerView(layer);
    await whenOnce(() => !layerView.updating);

    return layerView;
  }

  static async queryExtent(layer: FeatureLayer, where: string) {
    const query = layer.createQuery();
    query.where = where;
    return layer.queryExtent(query);
  }

  /** Optional: Apply client-side FeatureFilter if needed */
  static async filterFeatureLayerClientSide(layer: FeatureLayer, view: MapView, where: string) {
    const layerView = await view.whenLayerView(layer);
    layerView['filter'] = new FeatureFilter({ where });
    await whenOnce(() => !layerView.updating);
    return layerView;
  }
}


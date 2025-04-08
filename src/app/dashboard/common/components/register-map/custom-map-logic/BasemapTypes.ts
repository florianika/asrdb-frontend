import Basemap from "@arcgis/core/Basemap";
import WMTSLayer from "@arcgis/core/layers/WMTSLayer";

export const OSM_BASEMAP = 'osm';

export const HYBRID_BASEMAP = 'hybrid'

export const CUSTOM_BASEMAP = new Basemap({
  baseLayers: [
    new WMTSLayer({
      title: 'Custom',
      url: "https://di-albania-satellite1.img.arcgis.com/arcgis/rest/services/rgb/Albania_2023/MapServer/WMTS",
      serviceMode: "KVP",
    })
  ]
})

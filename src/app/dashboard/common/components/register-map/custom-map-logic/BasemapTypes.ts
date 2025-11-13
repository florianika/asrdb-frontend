import Basemap from '@arcgis/core/Basemap';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import WMSLayer from "@arcgis/core/layers/WMSLayer";

export const OSM_BASEMAP = 'osm';

export const HYBRID_BASEMAP = 'hybrid';

export const MAP_2025 = new Basemap({
  title: 'Map 2025',
  baseLayers: [
    new WMTSLayer({
      title: 'MAP_2025',
      url: 'https://di-albania-satellite1.img.arcgis.com/arcgis/rest/services/rgb/Albania_2025_L1/MapServer/WMTS',
      serviceMode: 'KVP',
    }),
  ],
});

export const MAP_2024 = new Basemap({
  title: 'Map 2024',
  baseLayers: [
    new WMTSLayer({
      title: 'MAP_2024',
      url: 'https://di-albania-satellite1.img.arcgis.com/arcgis/rest/services/rgb/Albania_2024L3/MapServer/WMTS',
      serviceMode: 'KVP',
    }),
  ],
});

export const MAP_2023 = new Basemap({
  title: 'Map 2023',
  baseLayers: [
    new WMTSLayer({
      title: 'MAP_2023',
      url: 'https://di-albania-satellite1.img.arcgis.com/arcgis/rest/services/rgb/Albania_2023/MapServer/WMTS',
      serviceMode: 'KVP',
    }),
  ],
});

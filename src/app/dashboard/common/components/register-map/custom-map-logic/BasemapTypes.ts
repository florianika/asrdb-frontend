import Basemap from '@arcgis/core/Basemap';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import WMSLayer from '@arcgis/core/layers/WMSLayer';

export const OSM_BASEMAP = 'osm';

export const HYBRID_BASEMAP = 'hybrid';

export const MAP_2007 = new Basemap({
  title: 'Map 2007',
  baseLayers: [
    new WMSLayer({
      title: 'MAP_2007',
      url: 'https://geoportal.asig.gov.al/service/orthophoto_2007/wms',
      version: '1.1.1',
      imageFormat: 'image/jpeg',
      spatialReferences: [3857],
      sublayers: [{ name: 'OrthoImagery' }],
    }),
  ],
});

export const MAP_2015_2017 = new Basemap({
  title: 'Map 2015-2017',
  baseLayers: [
    new WMSLayer({
      title: 'MAP_2015_2017',
      url: 'https://geoportal.asig.gov.al/service/orthophoto_2015/wms',
      version: '1.1.1',
      imageFormat: 'image/jpeg',
      spatialReferences: [3857],
      sublayers: [{ name: 'OrthoImagery_20cm' }],
    }),
  ],
});

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

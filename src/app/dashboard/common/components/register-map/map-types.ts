import Basemap from '@arcgis/core/Basemap';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';

export type CleanupCallback = () => void;
export type BasemapInput = Basemap | string;
export type MapLayer = FeatureLayer | GraphicsLayer;
export type GoToTarget = Parameters<MapView['goTo']>[0];

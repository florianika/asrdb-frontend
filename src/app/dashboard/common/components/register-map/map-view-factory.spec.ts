import MapView from '@arcgis/core/views/MapView';

import {
  configureWmtsConstraints,
  destroyMapSession,
} from './map-view-factory';

describe('map view factory', () => {
  it('runs callbacks, clears them, and destroys the view', () => {
    const view = jasmine.createSpyObj<MapView>('MapView', ['destroy']);
    const firstCleanup = jasmine.createSpy('firstCleanup');
    const secondCleanup = jasmine.createSpy('secondCleanup');
    const callbacks = [firstCleanup, secondCleanup];

    destroyMapSession(view, callbacks);

    expect(firstCleanup).toHaveBeenCalled();
    expect(secondCleanup).toHaveBeenCalled();
    expect(callbacks).toEqual([]);
    expect(view.destroy).toHaveBeenCalled();
  });

  it('keeps default zoom threshold for non-WMTS basemaps', async () => {
    const view = {
      map: { basemap: { baseLayers: [] } },
    } as unknown as MapView;
    const maxZoomHide = await configureWmtsConstraints(view, 12);

    expect(maxZoomHide).toBe(12);
  });
});

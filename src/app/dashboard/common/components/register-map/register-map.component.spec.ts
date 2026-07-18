import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import MapView from '@arcgis/core/views/MapView';

import { RegisterMapComponent } from './register-map.component';
import { RegisterMapService } from './register-map.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { AuthStateService } from '../../../../common/services/auth-state.service';

type DeferredPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
};

function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('RegisterMapComponent', () => {
  let fixture: ComponentFixture<RegisterMapComponent>;
  let component: RegisterMapComponent;

  let registerMapServiceMock: jasmine.SpyObj<RegisterMapService>;
  let esriAuthServiceMock: jasmine.SpyObj<CommonEsriAuthService>;
  let authStateServiceMock: jasmine.SpyObj<AuthStateService>;

  let filterSubject: Subject<void>;
  let globalIdsSubject: Subject<void>;
  let registerFilterServiceMock: {
    skipOtherFiltersApartFromGlobalId: boolean;
    setBuildingGlobalIdFilter: jasmine.Spy;
    updateGlobalIds: jasmine.Spy;
    prepareWhereCase: jasmine.Spy;
    prepareWhereCaseForEntrance: jasmine.Spy;
    getSelectedBuildingGlobalIds: jasmine.Spy;
    filterObservable: Subject<void>;
    globalIdsObservable: Subject<void>;
  };

  beforeEach(async () => {
    registerMapServiceMock = jasmine.createSpyObj<RegisterMapService>(
      'RegisterMapService',
      [
        'init',
        'filterBuildingData',
        'filterEntranceData',
        'highlightBuildings',
        'highlightEntrance',
        'cleanup',
        'hasActiveView',
      ]
    );
    registerMapServiceMock.init.and.returnValue(Promise.resolve({} as MapView));
    registerMapServiceMock.filterBuildingData.and.returnValue(
      Promise.resolve()
    );
    registerMapServiceMock.filterEntranceData.and.returnValue(
      Promise.resolve()
    );
    registerMapServiceMock.highlightBuildings.and.returnValue(
      Promise.resolve()
    );
    registerMapServiceMock.highlightEntrance.and.returnValue(Promise.resolve());
    registerMapServiceMock.hasActiveView.and.returnValue(false);

    esriAuthServiceMock = jasmine.createSpyObj<CommonEsriAuthService>(
      'CommonEsriAuthService',
      ['ensureEsriReady', 'isEsriAuthError']
    );
    esriAuthServiceMock.ensureEsriReady.and.returnValue(of(true));
    esriAuthServiceMock.isEsriAuthError.and.returnValue(false);

    authStateServiceMock = jasmine.createSpyObj<AuthStateService>(
      'AuthStateService',
      ['isRefreshing$']
    );
    authStateServiceMock.isRefreshing$.and.returnValue(of(false));

    filterSubject = new Subject<void>();
    globalIdsSubject = new Subject<void>();
    registerFilterServiceMock = {
      skipOtherFiltersApartFromGlobalId: false,
      setBuildingGlobalIdFilter: jasmine.createSpy('setBuildingGlobalIdFilter'),
      updateGlobalIds: jasmine.createSpy('updateGlobalIds'),
      prepareWhereCase: jasmine
        .createSpy('prepareWhereCase')
        .and.returnValue('1=1'),
      prepareWhereCaseForEntrance: jasmine
        .createSpy('prepareWhereCaseForEntrance')
        .and.returnValue('1=0'),
      getSelectedBuildingGlobalIds: jasmine
        .createSpy('getSelectedBuildingGlobalIds')
        .and.returnValue(['{BLD-1}']),
      filterObservable: filterSubject,
      globalIdsObservable: globalIdsSubject,
    };

    TestBed.configureTestingModule({
      imports: [RegisterMapComponent],
    });

    TestBed.overrideComponent(RegisterMapComponent, {
      set: {
        providers: [
          { provide: RegisterMapService, useValue: registerMapServiceMock },
          {
            provide: RegisterFilterService,
            useValue: registerFilterServiceMock,
          },
          { provide: CommonEsriAuthService, useValue: esriAuthServiceMock },
          { provide: AuthStateService, useValue: authStateServiceMock },
        ],
      },
    });

    fixture = TestBed.createComponent(RegisterMapComponent);
    component = fixture.componentInstance;
  });

  it('shows map status overlay while map is not ready and initializing', () => {
    spyOn(component, 'initializeMap').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.isMapInitializing = true;
    component.isMapReady = false;
    component.mapAuthError = null;
    component.isRefreshing$ = of(true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.map-status-overlay');
    expect(overlay).toBeTruthy();
  });

  it('hides map status overlay when map is ready even if initialization is still true', () => {
    spyOn(component, 'initializeMap').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.isMapInitializing = true;
    component.isMapReady = true;
    component.mapAuthError = null;
    component.isRefreshing$ = of(true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.map-status-overlay');
    expect(overlay).toBeFalsy();
  });

  it('marks map as ready before init promise resolves when view is already active', async () => {
    (component as unknown as { mapViewEl: ElementRef }).mapViewEl =
      new ElementRef(document.createElement('div'));

    const deferred = createDeferredPromise<MapView>();
    registerMapServiceMock.init.and.returnValue(deferred.promise);
    registerMapServiceMock.hasActiveView.and.returnValue(true);
    esriAuthServiceMock.ensureEsriReady.and.returnValue(of(true));

    const initPromise = component.initializeMap();
    await Promise.resolve();

    expect(component.isMapReady).toBeTrue();
    expect(component.isMapInitializing).toBeTrue();

    deferred.resolve({} as MapView);
    await initPromise;

    expect(component.isMapInitializing).toBeFalse();
  });

  it('keeps selected buildings visible on the list map and highlights them', async () => {
    component.highlightSelectedBuildings = true;
    registerFilterServiceMock.prepareWhereCase.and.returnValue(
      'BldQuality <> 0'
    );
    spyOn(component, 'initializeMap').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    filterSubject.next();
    await Promise.resolve();
    await Promise.resolve();

    expect(registerFilterServiceMock.prepareWhereCase).toHaveBeenCalledWith({
      includeGlobalId: false,
    });
    expect(registerMapServiceMock.filterBuildingData).toHaveBeenCalledWith(
      'BldQuality <> 0'
    );
    expect(registerMapServiceMock.highlightBuildings).toHaveBeenCalledWith([
      '{BLD-1}',
    ]);
  });

  it('keeps building entrances visible on the details map and highlights the selected entrance', async () => {
    component.highlightSelectedEntrance = true;
    component.entranceGlobalId = '{ENT-1}';
    const quote = String.fromCharCode(39);
    const entranceWhereCase = `EntBldGlobalID in (${quote}{BLD-1}${quote}) AND EntQuality <> 0`;
    registerFilterServiceMock.prepareWhereCaseForEntrance.and.returnValue(
      entranceWhereCase
    );
    spyOn(component, 'initializeMap').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    globalIdsSubject.next();
    await Promise.resolve();
    await Promise.resolve();

    expect(
      registerFilterServiceMock.prepareWhereCaseForEntrance
    ).toHaveBeenCalledWith('{ENT-1}', {
      includeEntranceId: false,
    });
    expect(registerMapServiceMock.filterEntranceData).toHaveBeenCalledWith(
      entranceWhereCase
    );
    expect(registerMapServiceMock.highlightEntrance).toHaveBeenCalledWith(
      '{ENT-1}'
    );
  });
});

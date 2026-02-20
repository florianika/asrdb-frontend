import { Injectable, isDevMode } from '@angular/core';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { CommonEntranceService } from '../../common/service/common-entrance.service';
import { CommonDwellingService } from '../../common/service/common-dwellings.service';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { EsriQueryResponse } from '../model/esri-response';

type DeleteAuditFields = {
  external_editor: string;
  external_editor_date: string;
};

type BuildingDeleteAttributes = {
  GlobalID: string;
  ObjectID?: number;
  OBJECTID?: number;
  BldQuality: number;
} & DeleteAuditFields;

type EntranceDeleteAttributes = {
  GlobalID: string;
  OBJECTID: number;
  EntQuality: number;
} & DeleteAuditFields;

type DwellingDeleteAttributes = {
  GlobalID: string;
  OBJECTID: number;
  DwlQuality: number;
} & DeleteAuditFields;

type DeleteFeature<TAttributes> = {
  attributes: TAttributes;
};

type DeleteDoneState = {
  buildingDone: boolean;
  entranceDone: boolean;
  dwellingDone: boolean;
};

type DeletePreviewState = {
  buildingsToDelete: DeleteFeature<BuildingDeleteAttributes>[];
  entrancesToDelete: DeleteFeature<EntranceDeleteAttributes>[];
  dwellingsToDelete: DeleteFeature<DwellingDeleteAttributes>[];
};

type GlobalObjectIdAttributes = {
  GlobalID?: string;
  OBJECTID?: number;
  ObjectID?: number;
};

type EsriAttributesResponse = EsriQueryResponse<GlobalObjectIdAttributes>;

@Injectable()
export class RegisterDeleteService {
  buildingsToDelete: DeleteFeature<BuildingDeleteAttributes>[] = [];
  entrancesToDelete: DeleteFeature<EntranceDeleteAttributes>[] = [];
  dwellingsToDelete: DeleteFeature<DwellingDeleteAttributes>[] = [];

  private defaultDeleteSignal: DeleteDoneState = {
    buildingDone: false,
    entranceDone: false,
    dwellingDone: false,
  };

  deleteDone = new BehaviorSubject<DeleteDoneState>(this.defaultDeleteSignal);
  deleteDataLoading = new BehaviorSubject<boolean>(false);
  state = new BehaviorSubject<DeletePreviewState>(this.getCurrentState());

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonDwellingService: CommonDwellingService,
    private matSnack: MatSnackBar,
    private authState: AuthStateService
  ) {}

  reset() {
    this.buildingsToDelete = [];
    this.entrancesToDelete = [];
    this.dwellingsToDelete = [];
    this.deleteDone.next(this.defaultDeleteSignal);
    this.deleteDataLoading.next(false);
    this.emitState();
  }

  deleteBuilding(buildingId: string) {
    this.deleteDone.next(this.defaultDeleteSignal);
    this.loadBuildingsToDelete(buildingId);
  }

  deleteEntrance(entranceId: string) {
    this.deleteDone.next(this.defaultDeleteSignal);
    this.loadEntranceToDelete(entranceId);
  }

  deleteDwelling(dwellingId: string) {
    this.deleteDone.next(this.defaultDeleteSignal);
    this.loadDwellingToDelete(dwellingId);
  }

  confirmDelete() {
    this.deleteData();
  }

  private loadBuildingsToDelete(buildingId: string) {
    this.deleteDataLoading.next(true);
    this.commonBuildingService
      .getBuildingData({
        where: `GlobalID='${buildingId}'`,
        returnGeometry: false,
        outFields: ['GlobalID', 'ObjectID'],
      })
      .pipe(
        catchError(err => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe(building => {
        if (building?.data?.features[0]?.attributes) {
          const baseAttributes = building.data.features[0].attributes;
          if (!baseAttributes.GlobalID) {
            this.deleteDataLoading.next(false);
            return;
          }
          const attributes: BuildingDeleteAttributes = {
            GlobalID: baseAttributes.GlobalID,
            ObjectID: baseAttributes.ObjectID,
            OBJECTID: baseAttributes.OBJECTID,
            BldQuality: 0,
            ...this.getAuditFields(),
          };
          this.buildingsToDelete.push({ attributes });
          this.emitState();
          this.loadEntrancesToDelete(buildingId);
        } else {
          this.deleteDataLoading.next(false);
        }
      });
  }

  private loadEntrancesToDelete(buildingId: string) {
    this.deleteDataLoading.next(true);
    this.commonEntranceService
      .getEntranceData({
        where: `EntBldGlobalID='${buildingId}' AND EntQuality <> 0`,
        returnGeometry: false,
        outFields: ['GlobalID', 'OBJECTID'],
        num: 9999,
      })
      .pipe(
        catchError(err => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe((entrances: EsriAttributesResponse | null) => {
        const entranceRequests = this.getEntranceDeleteFeatures(entrances);
        if (!entranceRequests.length) {
          this.deleteDataLoading.next(false);
          this.emitState();
          return;
        }

        this.entrancesToDelete = entranceRequests;
        this.emitState();

        const globalIds = entranceRequests
          .map(feature => feature.attributes.GlobalID)
          .filter(Boolean);
        this.loadDwellingsToDelete(globalIds);
      });
  }

  private loadEntranceToDelete(entranceId: string) {
    this.commonEntranceService
      .getEntranceData({
        where: `GlobalID='${entranceId}'`,
        returnGeometry: false,
        outFields: ['GlobalID', 'OBJECTID'],
        num: 9999,
      })
      .pipe(
        catchError(err => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe((entrances: EsriAttributesResponse | null) => {
        const entranceRequests = this.getEntranceDeleteFeatures(entrances);
        if (!entranceRequests.length) {
          this.emitState();
          this.deleteDataLoading.next(false);
          return;
        }

        this.entrancesToDelete = entranceRequests;
        this.emitState();

        const globalIds = entranceRequests
          .map(feature => feature.attributes.GlobalID)
          .filter(Boolean);
        this.loadDwellingsToDelete(globalIds);
      });
  }

  private loadDwellingToDelete(dwellingId: string) {
    this.deleteDataLoading.next(true);
    this.commonDwellingService
      .getDwellings({
        where: `GlobalID='${dwellingId}'`,
        returnGeometry: false,
        outFields: ['GlobalID', 'OBJECTID'],
        num: 9999,
      })
      .pipe(
        catchError(err => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe((dwellings: EsriAttributesResponse | null) => {
        this.dwellingsToDelete = this.getDwellingDeleteFeatures(dwellings);
        this.emitState();
        this.deleteDataLoading.next(false);
      });
  }

  private loadDwellingsToDelete(globalIds: string[]) {
    this.deleteDataLoading.next(true);
    this.commonDwellingService
      .getDwellings({
        where: `DwlEntGlobalID in (${globalIds.map(id => `'${id}'`).join(',')}) AND DwlQuality <> 0`,
        returnGeometry: false,
        outFields: ['GlobalID', 'OBJECTID'],
        num: 9999,
      })
      .pipe(
        catchError(err => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe((dwellings: EsriAttributesResponse | null) => {
        this.dwellingsToDelete = this.getDwellingDeleteFeatures(dwellings);
        this.emitState();
        this.deleteDataLoading.next(false);
      });
  }

  private deleteData() {
    if (isDevMode()) {
      console.log('Building to delete', this.buildingsToDelete);
      console.log('Entrance To delete', this.entrancesToDelete);
      console.log('Dwelling To delete', this.dwellingsToDelete);
    }

    if (this.dwellingsToDelete.length) {
      this.deleteDwellingData();
    } else if (this.entrancesToDelete.length) {
      this.deleteEntranceData();
    } else if (this.buildingsToDelete.length) {
      this.deleteBuildingData();
    }
  }

  private deleteDwellingData() {
    if (this.dwellingsToDelete.length) {
      this.commonDwellingService
        .updateFeature(this.dwellingsToDelete)
        .pipe(
          catchError(err => {
            console.error('Error deleting dwellings', err);
            this.matSnack.open(
              $localize`Error deleting dwellings`,
              $localize`Close`,
              {
                duration: 5000,
              }
            );
            return of(null);
          })
        )
        .subscribe(res => {
          if (!res) return;
          this.dwellingsToDelete = [];
          this.emitState();
          setTimeout(() => {
            this.reloadSignal();
            this.deleteEntranceData();
          }, 1000);
        });
    }
  }

  private deleteEntranceData() {
    if (this.entrancesToDelete.length) {
      this.commonEntranceService
        .updateFeature(this.entrancesToDelete)
        .pipe(
          catchError(err => {
            console.error('Error deleting entrances', err);
            this.matSnack.open(
              $localize`Error deleting entrances`,
              $localize`Close`,
              {
                duration: 5000,
              }
            );
            return of(null);
          })
        )
        .subscribe(res => {
          if (!res) return;
          this.entrancesToDelete = [];
          this.emitState();
          setTimeout(() => {
            this.reloadSignal();
            this.deleteBuildingData();
          }, 1000);
        });
    }
  }

  private deleteBuildingData() {
    if (this.buildingsToDelete.length) {
      this.commonBuildingService
        .updateFeature(this.buildingsToDelete)
        .pipe(
          catchError(err => {
            console.error('Error deleting buildings', err);
            this.matSnack.open(
              $localize`Error deleting buildings`,
              $localize`Close`,
              {
                duration: 5000,
              }
            );
            return of(null);
          })
        )
        .subscribe(res => {
          if (!res) return;
          this.buildingsToDelete = [];
          this.emitState();
          setTimeout(() => {
            this.reloadSignal();
          }, 1000);
        });
    }
  }

  private reloadSignal() {
    this.deleteDone.next({
      buildingDone: this.buildingsToDelete.length === 0,
      entranceDone: this.entrancesToDelete.length === 0,
      dwellingDone: this.dwellingsToDelete.length === 0,
    });
  }

  private getCurrentState(): DeletePreviewState {
    return {
      buildingsToDelete: this.buildingsToDelete,
      entrancesToDelete: this.entrancesToDelete,
      dwellingsToDelete: this.dwellingsToDelete,
    };
  }

  private emitState() {
    this.state.next(this.getCurrentState());
  }

  private getAuditFields(): DeleteAuditFields {
    return {
      external_editor: `{${this.authState.getNameId()}}` ?? '',
      external_editor_date: String(Date.now()),
    };
  }

  private getEntranceDeleteFeatures(
    response: EsriAttributesResponse | null
  ): DeleteFeature<EntranceDeleteAttributes>[] {
    return (response?.data?.features ?? [])
      .map(feature => feature.attributes)
      .map(attributes => {
        if (!attributes.GlobalID || attributes.OBJECTID == null) {
          return null;
        }
        return {
          attributes: {
            GlobalID: attributes.GlobalID,
            OBJECTID: attributes.OBJECTID,
            EntQuality: 0,
            ...this.getAuditFields(),
          },
        };
      })
      .filter(
        (feature): feature is DeleteFeature<EntranceDeleteAttributes> =>
          feature !== null
      );
  }

  private getDwellingDeleteFeatures(
    response: EsriAttributesResponse | null
  ): DeleteFeature<DwellingDeleteAttributes>[] {
    return (response?.data?.features ?? [])
      .map(feature => feature.attributes)
      .map(attributes => {
        if (!attributes.GlobalID || attributes.OBJECTID == null) {
          return null;
        }
        return {
          attributes: {
            GlobalID: attributes.GlobalID,
            OBJECTID: attributes.OBJECTID,
            DwlQuality: 0,
            ...this.getAuditFields(),
          },
        };
      })
      .filter(
        (feature): feature is DeleteFeature<DwellingDeleteAttributes> =>
          feature !== null
      );
  }
}

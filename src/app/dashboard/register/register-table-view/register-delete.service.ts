import {Injectable, isDevMode} from '@angular/core';
import {CommonBuildingService} from "../../common/service/common-building.service";
import {CommonEntranceService} from "../../common/service/common-entrance.service";
import {CommonDwellingService} from "../../common/service/common-dwellings.service";
import {BehaviorSubject, catchError, Observable, of} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable()
export class RegisterDeleteService {

  buildingsToDelete = [] as any[];
  entrancesToDelete = [] as any[];
  dwellingsToDelete = [] as any[];

  private defaultDeleteSignal = {
    buildingDone: false,
    entranceDone: false,
    dwellingDone: false
  };

  deleteDone = new BehaviorSubject(this.defaultDeleteSignal);
  deleteDataLoading = new BehaviorSubject(false);
  state = new BehaviorSubject({
    buildingsToDelete: this.buildingsToDelete,
    entrancesToDelete: this.entrancesToDelete,
    dwellingsToDelete: this.dwellingsToDelete
  })

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonDwellingService: CommonDwellingService,
    private matSnack: MatSnackBar
  ) { }

  reset() {
    this.buildingsToDelete = [];
    this.entrancesToDelete = [];
    this.dwellingsToDelete = [];
    this.deleteDone.next(this.defaultDeleteSignal);
    this.deleteDataLoading.next(false);
    this.state.next({
      buildingsToDelete: this.buildingsToDelete,
      entrancesToDelete: this.entrancesToDelete,
      dwellingsToDelete: this.dwellingsToDelete
    });
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
    this.commonBuildingService.getBuildingData({
      where: `GlobalID='${buildingId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "ObjectID"]
    })
      .pipe(catchError(err => of(null)))
      .subscribe((building) => {
        if (building?.data?.features[0]?.attributes) {
          const attributes = {
            ...building.data.features[0]?.attributes,
            BldQuality: 0
          };
          this.buildingsToDelete.push({attributes: attributes});
          this.state.next({
            buildingsToDelete: this.buildingsToDelete,
            entrancesToDelete: this.entrancesToDelete,
            dwellingsToDelete: this.dwellingsToDelete
          });
          this.loadEntrancesToDelete(buildingId);
        } else {
          this.deleteDataLoading.next(false);
        }
    });
  }

  private loadEntrancesToDelete(buildingId: string) {
    this.deleteDataLoading.next(true);
    this.commonEntranceService.getEntranceData({
      where: `EntBldGlobalID='${buildingId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
      num: 9999
    })
      .pipe(catchError(err => of(null)))
      .subscribe((entrances) => {
      if (!entrances?.data?.features?.length) {
        this.deleteDataLoading.next(false);
        this.state.next({
          buildingsToDelete: this.buildingsToDelete,
          entrancesToDelete: this.entrancesToDelete,
          dwellingsToDelete: this.dwellingsToDelete
        });
        return;
      }
      const entranceRequests = entrances?.data?.features
        ?.map((feature: any) => ({
          GlobalID: feature.attributes.GlobalID as string,
          OBJECTID: feature.attributes.OBJECTID,
          EntQuality: 0
        }))
        ?.map((attributes: any) => (
          {attributes: attributes}
        ));
      if (entranceRequests.length > 0) {
        this.entrancesToDelete = entranceRequests;
        this.state.next({
          buildingsToDelete: this.buildingsToDelete,
          entrancesToDelete: this.entrancesToDelete,
          dwellingsToDelete: this.dwellingsToDelete
        });
        // Load the dwellings
        const globalIds = entrances?.data?.features
          ?.map((feature: any) => feature.attributes.GlobalID as string)
          ?.filter((feature: string) => !!feature);
        this.loadDwellingsToDelete(globalIds);
      }
    });
  }

  private loadEntranceToDelete(entranceId: string) {
    this.commonEntranceService.getEntranceData({
      where: `GlobalID='${entranceId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
      num: 9999
    })
      .pipe(catchError(err => of(null)))
      .subscribe((entrances) => {
        if (!entrances?.data?.features?.length) {
          this.state.next({
            buildingsToDelete: this.buildingsToDelete,
            entrancesToDelete: this.entrancesToDelete,
            dwellingsToDelete: this.dwellingsToDelete
          });
          this.deleteDataLoading.next(false);
          return;
        }
        const entranceRequests = entrances?.data?.features
          ?.map((feature: any) => ({
            GlobalID: feature.attributes.GlobalID as string,
            OBJECTID: feature.attributes.OBJECTID,
            EntQuality: 0
          }))
          ?.map((attributes: any) => (
            {attributes: attributes}
          ));
        if (entranceRequests.length > 0) {
          this.entrancesToDelete = entranceRequests;

          // Load the dwellings
          const globalIds = entrances?.data?.features
            ?.map((feature: any) => feature.attributes.GlobalID as string)
            ?.filter((feature: string) => !!feature);
          this.loadDwellingsToDelete(globalIds);
        }
      });
  }

  private loadDwellingToDelete(dwellingId: string) {
    this.deleteDataLoading.next(true);
    this.commonDwellingService.getDwellings({
      where: `GlobalID='${dwellingId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
      num: 9999
    })
      .pipe(catchError(err => of(null)))
      .subscribe((dwellings: any) => {
        const dwellingRequests = dwellings?.data?.features
          ?.map((feature: any) => ({
            GlobalID: feature.attributes.GlobalID as string,
            OBJECTID: feature.attributes.OBJECTID,
            DwlQuality: 0
          }))
          ?.map((attributes: any) => (
            {attributes: attributes}
          ));
        this.dwellingsToDelete = dwellingRequests ?? [];
        this.state.next({
          buildingsToDelete: this.buildingsToDelete,
          entrancesToDelete: this.entrancesToDelete,
          dwellingsToDelete: this.dwellingsToDelete
        });
        this.deleteDataLoading.next(false);
      });
  }

  private loadDwellingsToDelete(globalIds: string[]) {
    this.deleteDataLoading.next(true);
    this.commonDwellingService.getDwellings({
      where: `DwlEntGlobalID in (${globalIds.map((id: string) => `'${id}'`).join(',')})`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
      num: 9999
    })
      .pipe(catchError(err => of(null)))
      .subscribe((dwellings: any) => {
      const dwellingRequests = dwellings?.data?.features
        ?.map((feature: any) => ({
          GlobalID: feature.attributes.GlobalID as string,
          OBJECTID: feature.attributes.OBJECTID,
          DwlQuality: 0
        }))
        ?.map((attributes: any) => (
          {attributes: attributes}
        ));
      this.dwellingsToDelete = dwellingRequests ?? [];
      this.state.next({
        buildingsToDelete: this.buildingsToDelete,
        entrancesToDelete: this.entrancesToDelete,
        dwellingsToDelete: this.dwellingsToDelete
      });
      this.deleteDataLoading.next(false);
    });
  }

  private deleteData() {
    if (isDevMode()) {
      console.log("Building to delete", this.buildingsToDelete);
      console.log("Entrance To delete", this.entrancesToDelete);
      console.log("Dwelling To delete", this.dwellingsToDelete);
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
      this.commonDwellingService.updateFeature(this.dwellingsToDelete)
        .pipe(catchError(err => {
          console.error("Error deleting dwellings", err);
          this.matSnack.open("Error deleting dwellings", "Close", {
            duration: 5000
          });
          return of(null);
        }))
        .subscribe(res => {
          if (!res) {
            return;
          }
          this.dwellingsToDelete = [];
          this.state.next({
            buildingsToDelete: this.buildingsToDelete,
            entrancesToDelete: this.entrancesToDelete,
            dwellingsToDelete: this.dwellingsToDelete
          });
          setTimeout(() => {
            this.reloadSignal();
            this.deleteEntranceData();
          }, 1000); // Delay to ensure the UI updates properly
        }
      );
    }
  }

  private deleteEntranceData() {
    if (this.entrancesToDelete.length) {
      this.commonEntranceService.updateFeature(this.entrancesToDelete)
        .pipe(catchError(err => {
          console.error("Error deleting entrances", err);
          this.matSnack.open("Error deleting entrances", "Close", {
            duration: 5000
          });
          return of(null);
        }))
        .subscribe(res => {
          if (!res) {
            return;
          }
          this.entrancesToDelete = [];
          this.state.next({
            buildingsToDelete: this.buildingsToDelete,
            entrancesToDelete: this.entrancesToDelete,
            dwellingsToDelete: this.dwellingsToDelete
          });
          setTimeout(() => {
            this.reloadSignal();
            this.deleteBuildingData();
          }, 1000); // Delay to ensure the UI updates properly
        }
      );
    }
  }

  private deleteBuildingData() {
    if (this.buildingsToDelete.length) {
      this.commonBuildingService.updateFeature(this.buildingsToDelete)
        .pipe(catchError(err => {
          console.error("Error deleting buildings", err);
          this.matSnack.open("Error deleting buildings", "Close", {
            duration: 5000
          });
          return of(null);
        }))
        .subscribe(res => {
          if (!res) {
            return;
          }
          this.buildingsToDelete = [];
          this.state.next({
              buildingsToDelete: this.buildingsToDelete,
              entrancesToDelete: this.entrancesToDelete,
              dwellingsToDelete: this.dwellingsToDelete
            });
            setTimeout(() => {
              this.reloadSignal();
            }, 1000); // Delay to ensure the UI updates properly
          }
        );
    }
  }

  private reloadSignal() {
    this.deleteDone.next({
      buildingDone: this.buildingsToDelete.length === 0,
      entranceDone: this.entrancesToDelete.length === 0,
      dwellingDone: this.dwellingsToDelete.length === 0
    });
  }
}

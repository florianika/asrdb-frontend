import {Injectable, isDevMode} from '@angular/core';
import {CommonBuildingService} from "../../common/service/common-building.service";
import {CommonEntranceService} from "../../common/service/common-entrance.service";
import {CommonDwellingService} from "../../common/service/common-dwellings.service";
import {BehaviorSubject, catchError, Observable, of} from "rxjs";

@Injectable()
export class RegisterDeleteService {

  buildingsToDelete = [] as any[];
  entrancesToDelete = [] as any[];
  dwellingsToDelete = [] as any[];

  deleteDone = new BehaviorSubject(false);

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonDwellingService: CommonDwellingService
  ) { }

  deleteBuilding(buildingId: string) {
    this.deleteDone.next(false);
    this.loadBuildingsToDelete(buildingId);
  }

  deleteEntrance(entranceId: string) {
    this.deleteDone.next(false);
    this.loadEntranceToDelete(entranceId);
  }

  deleteDwelling(dwellingId: string) {
    this.deleteDone.next(false);
    this.loadDwellingToDelete(dwellingId);
  }

  private loadBuildingsToDelete(buildingId: string) {
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
          this.loadEntrancesToDelete(buildingId);
        }
    });
  }

  private loadEntrancesToDelete(buildingId: string) {
    this.commonEntranceService.getEntranceData({
      where: `EntBldGlobalID='${buildingId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"]
    })
      .pipe(catchError(err => of(null)))
      .subscribe((entrances) => {
      if (!entrances?.data?.features?.length) {
        this.deleteData();
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

  private loadEntranceToDelete(entranceId: string) {
    this.commonEntranceService.getEntranceData({
      where: `GlobalID='${entranceId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"]
    })
      .pipe(catchError(err => of(null)))
      .subscribe((entrances) => {
        if (!entrances?.data?.features?.length) {
          this.deleteData();
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
    this.commonDwellingService.getDwellings({
      where: `GloablID='${dwellingId}'`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
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
        this.deleteData();
      });
  }

  private loadDwellingsToDelete(globalIds: string[]) {
    if (!globalIds?.length) {
      this.deleteData();
    }
    this.commonDwellingService.getDwellings({
      where: `DwlEntGlobalID in (${globalIds.map((id: string) => `'${id}'`).join(',')})`,
      returnGeometry: false,
      outFields: ["GlobalID", "OBJECTID"],
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
      this.deleteData();
    });
  }

  private deleteData() {
    if (!this.buildingsToDelete.length) {
      return;
    }
    if (isDevMode()) {
      console.log("Building to delete", this.buildingsToDelete);
      console.log("Entrance To delete", this.entrancesToDelete);
      console.log("Dwelling To delete", this.dwellingsToDelete);
    }

    if (this.dwellingsToDelete.length) {
      this.commonDwellingService.updateFeature(this.dwellingsToDelete)
        .pipe(catchError(err => of(null)))
        .subscribe(res => {
            this.dwellingsToDelete = [];
            this.reloadSignal();
          }
        );
    }
    if (this.entrancesToDelete.length) {
      this.commonEntranceService.updateFeature(this.entrancesToDelete)
        .pipe(catchError(err => of(null)))
        .subscribe(res => {
          this.entrancesToDelete = [];
          this.reloadSignal();
        }
      );
    }
    if (this.buildingsToDelete.length) {
      this.commonBuildingService.updateFeature(this.buildingsToDelete)
        .pipe(catchError(err => of(null)))
        .subscribe(res => {
          this.buildingsToDelete = [];
          this.reloadSignal();
        }
      );
    }
  }

  private reloadSignal() {
    if (!this.buildingsToDelete.length && !this.entrancesToDelete.length && !this.dwellingsToDelete.length) {
      this.deleteDone.next(true);
    }
  }
}

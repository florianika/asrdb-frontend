import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";

import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Popup from '@arcgis/core/widgets/Popup'
import { CommonEsriAuthService } from "src/app/dashboard/buildings-register/common/service/common-esri-auth.service";
import { CommonBuildingService } from "src/app/dashboard/buildings-register/common/service/common-building.service";
import { CommonEntranceService } from "src/app/dashboard/buildings-register/common/service/common-entrance.service";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";

@Component({
  selector: "asrdb-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"]
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;

  public view: MapView | null = null;
  private bldlayer: FeatureLayer = this.buildingService.bldLayer;
  private entlayer = this.entranceService.entLayer;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private esriAuthService: CommonEsriAuthService) { }

  ngOnInit(): any {
    // this.overviewService.inizializeAuth();

    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.')
    })
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }

  async initializeMap(): Promise<any> {
    const container = this.mapViewEl.nativeElement;
    const webmap = new WebMap({
      basemap: "hybrid",
      layers: [this.bldlayer, this.entlayer]
    });

    this.view = new MapView({
      container,
      popup: new Popup({
        dockEnabled: true,
        dockOptions: {
          // Disables the dock button from the popup
          buttonEnabled: false,
          // Ignore the default sizes that trigger responsive docking
          breakpoint: false
        },
        visibleElements: {
          closeButton: false,
        }
      }),
      map: webmap
    });

    this.view.when(() => {
      const centerPoint = this.view?.center.clone();

      this.view?.popup.set("dockOptions", {
        breakpoint: false,
        buttonEnabled: false,
        position: "top-left"
      });
    });

    (await this.view.whenLayerView(this.bldlayer)).filter = new FeatureFilter({
      where: "BldType > 2"
    });
    this.view.goTo(this.bldlayer.fullExtent);
  }
}

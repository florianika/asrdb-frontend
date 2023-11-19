import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  isDevMode
} from "@angular/core";

import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup'
import { OverviewService } from "../service/overview.service";

@Component({
  selector: "asrdb-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"]
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;

  public view: MapView | null = null;

  constructor(private overviewService: OverviewService) {}

  async initializeMap(): Promise<any> {
    const container = this.mapViewEl.nativeElement;
    const webmap = new WebMap({
      basemap: "hybrid",
      layers: [this.overviewService.bldLayer, this.overviewService.entLayer]
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
          closeButton: false
        }
      }),
      map: webmap
    });

    this.view.when(() => {
      void this.view?.center.clone();

      this.view?.popup.set("dockOptions", {
        breakpoint: false,
        buttonEnabled: false,
        position: "top-left"
      });
    });

    await this.view.whenLayerView(this.overviewService.bldLayer);
    this.view.goTo(this.overviewService.bldLayer.fullExtent);
  }

  ngOnInit(): any {
    // this.overviewService.inizializeAuth();

    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      if (isDevMode()) {
        console.log('The map is ready.')
      }
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }
}

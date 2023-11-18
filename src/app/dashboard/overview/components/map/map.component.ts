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
import OAuthInfo from '@arcgis/core/identity/OAuthInfo'
import esriId from "@arcgis/core/identity/IdentityManager";
import esriConfig from "@arcgis/core/config"
import { EChartsOption } from 'echarts';

@Component({
  selector: "asrdb-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"]
})
export class MapComponent implements OnInit, OnDestroy {

  public view: MapView | null = null;

  bldlayer: FeatureLayer = new FeatureLayer({
    title: "ASRDB Buildings",
    url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/1",
    outFields: ["*"],
    renderer: {
      type: "unique-value", // autocasts as new UniqueValueRenderer()
      defaultSymbol: this.getSymbol("#FAFAFA"),
      defaultLabel: "Other",
      field: "BldStatus",
      uniqueValueInfos: [
        {
          value: 1,
          label: "Permitted (linked to a construction permission)",
          symbol: this.getSymbol("#00BF7")
        },
        {
          value: 2,
          label: "Under construction (linked to a construction permission)",
          symbol: this.getSymbol("#00B4C5")
        },
        {
          value: 3,
          label: "Completed (linked to a construction permission)",
          symbol: this.getSymbol("#5BA300")
        },
        {
          value: 4,
          label: "Existing",
          symbol: this.getSymbol("#89CE00")
        },
        {
          value: 5,
          label: "Abandoned (residential and non-residential use excluded)",
          symbol: this.getSymbol("#E6308A")
        },
        {
          value: 6,
          label: "Demolished (not existing anymore)",
          symbol: this.getSymbol("#B51963")
        },
        {
          value: 9,
          label: "Unknown building status",
          symbol: this.getSymbol("#F57600")
        }
      ]
    } as __esri.RendererProperties,
    minScale: 0,
    maxScale: 0,
    // create a new popupTemplate for the layer
    popupTemplate: {
      // autocasts as new PopupTemplate()
      title: "ASRDB Building {GlobalID}",
      content: [
        {
          // It is also possible to set the fieldInfos outside of the content
          // directly in the popupTemplate. If no fieldInfos is specifically set
          // in the content, it defaults to whatever may be set within the popupTemplate.
          type: "fields",
          fieldInfos: [
            {
              fieldName: "BldStatus",
              label: "Status"
            }, {
              fieldName: "BldEntranceRecs",
              label: "Number of recorded entrances"
            }, {
              fieldName: "BldDwellingRecs",
              label: "Number of recorded dwellings"
            }
          ]
        }
      ]
    }
  });

  entlayer = new FeatureLayer({
    title: "ASRDB Entrances",
    url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/0",
    outFields: ["*"],
    minScale: 0,
    maxScale: 0,
    // create a new popupTemplate for the layer
    popupTemplate: {
      // autocasts as new PopupTemplate()
      title: "ASRDB Entrance {GlobalID}",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porttitor mi nec urna rutrum maximus. Maecenas vulputate rutrum ex, sed vulputate odio finibus quis. Sed sed sapien sed arcu facilisis sollicitudin in eu mi."
    }
  });

  getSymbol(color: string) {
    return {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: color,
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: color,
        width: 1
      }
    };
  }

  // The <div> where we will place the map
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;

  inizializeAuth(): void {
    const portalUrl = "https://gislab.teamdev.it/portal"
    const apiKey = "7pVCdD54JxE7lOPm"
    esriConfig.portalUrl = portalUrl;
    esriConfig.apiKey = apiKey

    const oAuthInfo = new OAuthInfo({
      portalUrl: portalUrl,
      appId: apiKey,
      flowType: "auto", // default that uses two-step flow
      popup: false
    });
    esriId.registerOAuthInfos([oAuthInfo]);
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
          closeButton: false
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

    await this.view.whenLayerView(this.bldlayer);
    this.view.goTo(this.bldlayer.fullExtent);
  }

  ngOnInit(): any {
    // this.inizializeAuth();

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
}

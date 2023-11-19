import { Injectable, OnDestroy } from "@angular/core";
import OAuthInfo from "@arcgis/core/identity/OAuthInfo";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import esriId from "@arcgis/core/identity/IdentityManager";
import esriConfig from "@arcgis/core/config"
import { Subject } from "rxjs/internal/Subject";
import { AuthStateService } from "src/app/common/services/auth-state.service";
import { takeUntil } from "rxjs";

@Injectable()
export class OverviewService implements OnDestroy {
  private ESRI_AUTH_KEY = 'ESRI-AUTH';
  private portalUrl = "https://gislab.teamdev.it/portal";
  private apiKey = "7pVCdD54JxE7lOPm";
  private subscription = new Subject<boolean>();

  uniqueValueInfos = [
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
  ];

  get bldLayer(): FeatureLayer {
    return new FeatureLayer({
      title: "ASRDB Buildings",
      url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/1",
      outFields: ["*"],
      renderer: {
        type: "unique-value", // autocasts as new UniqueValueRenderer()
        defaultSymbol: this.getSymbol("#FAFAFA"),
        defaultLabel: "Other",
        field: "BldStatus",
        uniqueValueInfos: this.uniqueValueInfos
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
  }

  get entLayer(): FeatureLayer {
    return new FeatureLayer({
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
  }

  constructor(private authState: AuthStateService) {
    this.authState.getLoginStateAsObservable().pipe(takeUntil(this.subscription)).subscribe((loginState: boolean) => {
      if (!loginState) {
        localStorage.removeItem(this.ESRI_AUTH_KEY);
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription.next(true);
    this.subscription.complete();
  }

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

  inizializeAuth(): void {
    this.initIdentityProvider();
    this.initEsriConfig();
    this.registerOAuth();
    esriId.on('credential-create', () => {
      localStorage.setItem(this.ESRI_AUTH_KEY, JSON.stringify(esriId.toJSON()));
    })
  }

  private initEsriConfig() {
    esriConfig.portalUrl = this.portalUrl;
    esriConfig.apiKey = this.apiKey;
  }

  private initIdentityProvider() {
    const config = localStorage.getItem(this.ESRI_AUTH_KEY);
    if (config) {
      esriId.initialize(JSON.parse(config));
    }
  }

  private registerOAuth() {
    // const oAuthInfo = new OAuthInfo({
    //   portalUrl: portalUrl,
    //   appId: apiKey,
    //   flowType: "auto", // default that uses two-step flow
    //   popup: true
    // });
    // esriId.registerOAuthInfos([oAuthInfo]);
  }
}

import {Injectable} from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {CommonEsriAuthService} from './common-esri-auth.service';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommonMunicipalityService {

  get municipalityLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: 'ASRDB Municipality Layer',
      url: environment.municipality_url,
      outFields: ['*'],
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService
  ) {}
}

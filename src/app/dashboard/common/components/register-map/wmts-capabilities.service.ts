import { Injectable } from '@angular/core';
import esriRequest from '@arcgis/core/request';

// Parsed LOD structure that ArcGIS MapView accepts
export interface WMTSLOD {
  level: number;
  scale: number;
  resolution?: number;
}

@Injectable({ providedIn: 'root' })
export class WmtsCapabilitiesService {
  private lodCache = new Map<string, WMTSLOD[]>();

  constructor() {}

  /**
   * Returns LODs for the WMTS service.
   * Uses in-memory caching so capabilities are requested only once per URL.
   */
  async getLODs(url: string): Promise<WMTSLOD[]> {
    if (this.lodCache.has(url)) {
      return this.lodCache.get(url)!;
    }

    try {
      const capabilitiesUrl = `${url}?request=GetCapabilities&service=WMTS`;

      const response = await esriRequest(capabilitiesUrl, {
        responseType: 'text',
      });

      const lods = this.extractLODsFromCapabilities(response.data);

      this.lodCache.set(url, lods);
      return lods;
    } catch (error) {
      console.error('WMTS capabilities fetch failed:', error);
      return [];
    }
  }

  /**
   * Parse WMTS capabilities XML → extract scale denominators → convert into LODs.
   */
  private extractLODsFromCapabilities(capabilitiesXML: string): WMTSLOD[] {
    const xml = new DOMParser().parseFromString(capabilitiesXML, 'text/xml');

    const scales = Array.from(xml.getElementsByTagName('ScaleDenominator'))
      .map(n => parseFloat(n.textContent || '0'))
      .filter(n => !isNaN(n));

    return scales.map((scale, index) => ({
      level: index,
      scale: scale,
      resolution: 0, // optional
    }));
  }
}

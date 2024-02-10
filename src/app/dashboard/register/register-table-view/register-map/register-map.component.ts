import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { RegisterMapService } from './register-map.service';

@Component({
  selector: 'asrdb-register-map',
  standalone: true,
  imports: [CommonModule],
  providers: [RegisterMapService],
  templateUrl: './register-map.component.html',
  styleUrls: ['./register-map.component.css']
})
export class RegisterMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() whereExpression = '';
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  constructor(private registerMapService: RegisterMapService) { }

  ngOnInit(): void {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['whereExpression']) {
      this.registerMapService.filterData(this.view, this.whereExpression);
    }
  }

  async initializeMap(): Promise<any> {
    this.view = await this.registerMapService.init(this.mapViewEl);
  }
}

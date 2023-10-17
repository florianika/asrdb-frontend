import { Component } from '@angular/core';

@Component({
  selector: 'asrdb-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent {
  center = { lat: 24, lng: 12 };
  zoom = 4;
  display!: google.maps.LatLngLiteral;

  moveMap(event: google.maps.MapMouseEvent) {
    this.center = event.latLng!.toJSON();
  }

  move(event: google.maps.MapMouseEvent) {
    this.display = event.latLng!.toJSON();
  }
}

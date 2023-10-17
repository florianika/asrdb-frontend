import { Component } from '@angular/core';

@Component({
  selector: 'asrdb-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css']
})
export class GraphsComponent {
  public graph = {
    data: [{ x: [1, 2, 3], y: [2, 5, 3], type: 'bar' }],
    layout: { autosize: true, title: 'A Fancy Plot' },
  };
  public graph2 = {
    data: [{ x: [1, 2, 3], y: [2, 5, 3], type: 'line' }],
    layout: { autosize: true, title: 'A Fancy Plot' },
  };

  trace1 = {
    x: [1, 2, 3, 4],
    y: [10, 15, 13, 17],
    mode: 'markers',
    type: 'scatter'
  };

  trace2 = {
    x: [2, 3, 4, 5],
    y: [16, 5, 11, 9],
    mode: 'lines',
    type: 'scatter'
  };

  trace3 = {
    x: [1, 2, 3, 4],
    y: [12, 9, 15, 12],
    mode: 'lines+markers',
    type: 'scatter'
  };

  data = [this.trace1, this.trace2, this.trace3];
  public graph3 = {
    data: [this.trace1, this.trace2, this.trace3],
    layout: { autosize: true, title: 'A Fancy Plot' },
  };
}

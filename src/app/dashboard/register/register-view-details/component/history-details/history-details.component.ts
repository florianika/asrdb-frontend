import {Component, Input, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {BuildingDetailComponent} from "../building-detail/building-detail.component";
import {MatCardModule} from "@angular/material/card";
import {getDate} from "../../../model/common-utils";
import {HistoryDetailsService} from "./history-details.service";

@Component({
  selector: 'asrdb-history-details',
  standalone: true,
  imports: [CommonModule, BuildingDetailComponent, MatCardModule],
  providers: [
    HistoryDetailsService
  ],
  templateUrl: './history-details.component.html',
  styleUrls: ['./history-details.component.css']
})
export class HistoryDetailsComponent implements OnInit {
  @Input() externalCreator!: string;
  @Input() externalCreationDate!: string;
  @Input() externalUpdater!: string;
  @Input() externalUpdateDate!: string;
  protected readonly getDate = getDate;

  externalCreatorObservable = this.historyService.createUserObservable;
  externalUpdaterObservable = this.historyService.updateUserObservable;

  constructor(private historyService: HistoryDetailsService) {
  }

  ngOnInit() {
    this.historyService.loadUserDetails(this.externalCreator, this.externalUpdater);
  }
}

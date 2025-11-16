import {Component, inject, TemplateRef, ViewChild} from '@angular/core';
import {FieldWorkClosureService, FieldWorkClosureStatus} from "../../field-work-closure.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {NgxEditorModule} from "ngx-editor";
import {MatDialog, MatDialogModule, MatDialogRef, MatDialogState} from "@angular/material/dialog";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatTableDataSource} from "@angular/material/table";
import {MUNICIPALITIES} from "../../../../../common/data/municipalities";
import {MatPaginator} from "@angular/material/paginator";

@Component({
  selector: 'asrdb-step-3-field-work-closure-summary',
  standalone: true,
  imports: [
    MatButton,
    NgxEditorModule,
    MatDialogModule,
    MatProgressSpinner
  ],
  templateUrl: './step-3-field-work-closure-summary.component.html',
  styleUrl: './step-3-field-work-closure-summary.component.css'
})
export class Step3FieldWorkClosureSummaryComponent {
  private fieldWorkClosureService = inject(FieldWorkClosureService);
  private router = inject(Router);
  private matDialog = inject(MatDialog);

  private activatedRoute = inject(ActivatedRoute);
  private fieldWorkId = this.activatedRoute.snapshot.params['id'];
  private dialogRef: MatDialogRef<any> | undefined;
  public fieldWorkStatistics = this.fieldWorkClosureService.fieldWorkStatistics;
  public columns = ['municipalityName', 'approvedBuildings', 'fieldworkBuildings', 'progressPercent', 'status'];
  public datasource = new MatTableDataSource<FieldWorkClosureStatus>();
  public municipalities = MUNICIPALITIES.sort((a, b) => a.name.localeCompare(b.name));

  @ViewChild("confirmationDialog") confirmationDialog?: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    if (this.dialogRef?.getState() === MatDialogState.OPEN && this.fieldWorkStatistics().status === 'ERROR' || this.fieldWorkStatistics().status === 'CLOSED') {
      this.closeDialog();
    }
  }


  close() {
    void this.router.navigate(['dashboard', 'field-work']);
  }

  next() {
    if (this.confirmationDialog) {
      this.dialogRef = this.matDialog.open(this.confirmationDialog, {
        disableClose: true
      });
    }
  }

  closeFieldWork() {
    this.fieldWorkClosureService.closeFieldWork(this.fieldWorkId);
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }
}

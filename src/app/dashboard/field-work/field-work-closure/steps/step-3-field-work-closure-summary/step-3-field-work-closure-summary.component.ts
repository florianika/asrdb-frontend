import {Component, inject, TemplateRef, ViewChild} from '@angular/core';
import {FieldWorkClosureService} from "../../field-work-closure.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {NgxEditorModule} from "ngx-editor";
import {MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

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

  @ViewChild("confirmationDialog") confirmationDialog?: TemplateRef<any>;

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

  // TODO: Implement the logic to close the field work
  closeFieldWork() {
    this.fieldWorkStatistics.update((prev) => ({
      ...prev,
      loading: true,
      status: ''
    }));
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }
}

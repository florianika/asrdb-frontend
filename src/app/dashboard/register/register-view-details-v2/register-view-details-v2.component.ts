import {
  Component,
  inject,
  isDevMode,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { RegisterViewDetailsService } from './register-view-details.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentViewComponent } from './comment-view/comment-view.component';
import { HistoryDetailsComponent } from './history-details/history-details.component';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { NgForOf, NgIf } from '@angular/common';
import { RegisterMapComponent } from '../../common/components/register-map/register-map.component';
import { Building } from '../model/building';
import { EntranceDetailsService } from './entrance/entrance-details.service';
import { EntranceListComponent } from './entrance/entrance-list/entrance-list.component';
import { DwellingListComponent } from './dwelling/dwelling-list/dwelling-list.component';
import { BuildingDetailComponent } from './building-detail/building-detail.component';
import { AuthStateService } from '../../../common/services/auth-state.service';

@Component({
  selector: 'asrdb-register-view-details-v2',
  imports: [
    CommentViewComponent,
    HistoryDetailsComponent,
    MatButton,
    MatCard,
    MatCardContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatDivider,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatProgressSpinner,
    MatTooltip,
    NgForOf,
    NgIf,
    RegisterMapComponent,
    MatMenuTrigger,
    EntranceListComponent,
    DwellingListComponent,
    BuildingDetailComponent,
  ],
  templateUrl: './register-view-details-v2.component.html',
  standalone: true,
  styleUrl: './register-view-details-v2.component.css',
})
export class RegisterViewDetailsV2Component implements OnInit, OnDestroy {
  @ViewChild('approveReview') approveReview?: TemplateRef<unknown>;
  @ViewChild('rejectReview') rejectReview?: TemplateRef<unknown>;

  id: string = '';
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private registerViewDetailsService = inject(RegisterViewDetailsService);
  private entranceDetailsService = inject(EntranceDetailsService);
  private matDialog = inject(MatDialog);
  private authStateService = inject(AuthStateService);

  private dialog?: MatDialogRef<any>;

  public structures = this.registerViewDetailsService.viewStructures;
  public viewData = this.registerViewDetailsService.viewData;
  public entranceViewData = this.entranceDetailsService.viewData;

  get selectedEntrance() {
    return this.entranceViewData().selectedEntrance;
  }

  get buildingStructure() {
    return this.structures().buildingStructure;
  }

  get isLoading() {
    return this.viewData().isLoading;
  }

  get isExecutingRules() {
    return this.viewData().isExecutingRules;
  }

  get isUpdatingFeature() {
    return this.viewData().isUpdatingFeature;
  }

  get building() {
    return this.viewData().building;
  }

  get isAdmin() {
    return this.authStateService.isAdmin();
  }

  get isSupervisor() {
    return this.authStateService.isSupervisor();
  }

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.registerViewDetailsService.init(this.id);
    } else {
      void this.router.navigateByUrl('dashboard/register');
    }
  }

  ngOnDestroy(): void {
    this.dialog?.close();
    this.registerViewDetailsService.cleanup();
  }

  goBack() {
    void this.router.navigateByUrl('dashboard/register?from=details');
  }

  editBuilding() {
    void this.router.navigateByUrl(
      'dashboard/register/form/BUILDING/' + this.id
    );
  }

  startExecution() {
    this.registerViewDetailsService.startExecution(this.id);
  }

  gotToLogs() {
    void this.router.navigateByUrl(
      'dashboard/register/logs?buildings=' + this.id
    );
  }

  openApproveReview() {
    if (this.approveReview) {
      this.dialog = this.matDialog.open(this.approveReview, {
        disableClose: true,
      });
    }
  }

  openRejectReview() {
    if (this.rejectReview) {
      this.dialog = this.matDialog.open(this.rejectReview, {
        disableClose: true,
      });
    }
  }

  getValueFromStatus(key: string) {
    return this.registerViewDetailsService.getValueFromStatus(
      key as keyof Building
    );
  }

  approveReviewForBuilding() {
    if (!this.dialog) {
      if (isDevMode()) {
        console.error('Dialog reference is undefined');
      }
      return;
    }
    this.registerViewDetailsService.approveReviewForBuilding(this.dialog);
  }

  rejectReviewForBuilding() {
    if (!this.dialog) {
      if (isDevMode()) {
        console.error('Dialog reference is undefined');
      }
      return;
    }
    this.registerViewDetailsService.rejectReviewForBuilding(this.dialog);
  }
}

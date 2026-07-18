import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommentService } from './comment.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CreateComment } from './comment.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthStateService } from '../../../../common/services/auth-state.service';

@Component({
    selector: 'asrdb-comment-view',
    imports: [
        MatCardModule,
        CommonModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
    ],
    providers: [CommentService],
    templateUrl: './comment-view.component.html',
    styleUrl: './comment-view.component.css'
})
export class CommentViewComponent implements OnInit {
  @Input() buildingId: string | undefined;
  @ViewChild('deleteConfirmation') deleteConfirmation?: TemplateRef<any>;

  public commentsObservable$ = this.commentService.commentsAsObservable;
  public savingCommentObservable$ =
    this.commentService.savingCommentAsObservable;
  public comment = '';

  constructor(
    private commentService: CommentService,
    private authStateService: AuthStateService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.buildingId) {
      this.commentService.loadComments(this.buildingId);
    }
  }

  public saveComment(): void {
    if (!this.buildingId || !this.comment) {
      return;
    }
    const commentData = {
      bldId: this.buildingId.replace('{', '').replace('}', '').trim(),
      noteText: this.comment,
      createdUser: this.authStateService.getFullName(),
      userId: this.authStateService.getNameId() || '',
    } as CreateComment;

    this.commentService.saveComment(commentData);
    this.comment = ''; // Clear the comment input after saving
  }

  public deleteComment(commentId: number): void {
    if (!this.buildingId || !commentId || !this.deleteConfirmation) {
      return;
    }
    const ref = this.matDialog
      .open(this.deleteConfirmation)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.commentService.deleteComment(this.buildingId!, commentId);
        }
        ref.unsubscribe();
      });
  }

  public isOwner(commentUserId: string): boolean {
    if (!commentUserId) {
      return false;
    }
    const currentUserId = this.authStateService.getNameId();
    const isAdmin =
      this.authStateService.isAdmin() || this.authStateService.isSupervisor();
    const isCurrentUser = currentUserId
      ? commentUserId === currentUserId
      : false;
    return isAdmin || isCurrentUser;
  }
}

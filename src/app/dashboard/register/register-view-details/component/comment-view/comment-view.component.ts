import {Component, Input, OnInit} from '@angular/core';
import {CommentService} from "./comment.service";
import {MatCardModule} from "@angular/material/card";
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {AuthStateService} from "../../../../../common/services/auth-state.service";
import {CreateComment} from "./comment.model";

@Component({
  selector: 'asrdb-comment-view',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  providers:[CommentService],
  templateUrl: './comment-view.component.html',
  styleUrl: './comment-view.component.css'
})
export class CommentViewComponent implements OnInit {
  @Input() buildingId: string | undefined;
  public commentsObservable$ = this.commentService.commentsAsObservable;
  public savingCommentObservable$ = this.commentService.savingCommentAsObservable;
  public comment = '';

  constructor(private commentService: CommentService, private authStateService: AuthStateService) {
  }

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
      createdUser: this.authStateService.getFullName()
    } as CreateComment;

    this.commentService.saveComment(commentData);
    this.comment = ''; // Clear the comment input after saving
  }
}

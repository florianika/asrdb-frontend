import { Injectable } from '@angular/core';
import {Comments, CreateComment} from "./comment.model";
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {environment} from "../../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private comments = new BehaviorSubject<{loading: boolean, comments: Comments}>({
    loading: true,
    comments: { notesDTO: [] }
  });
  private savingComment = new BehaviorSubject<boolean>(false);

  get commentsAsObservable() {
    return this.comments.asObservable();
  }
  get savingCommentAsObservable() {
    return this.savingComment.asObservable();
  }

  constructor(private httpClient: HttpClient, private matSnackBar: MatSnackBar) { }

  public loadComments(buildingId: string) {
    if (!buildingId) {
      console.warn('Building ID is required to load comments');
      this.comments.next({
        loading: false,
        comments: { notesDTO: [] }
      });
      return;
    }
    this.comments.next({
      loading: true,
      comments: { notesDTO: [] }
    });
    const cleanedBuildingId = buildingId
      .replace('{', '')
      .replace('}', '')
      .trim();
    this.httpClient.get<Comments>(environment.base_url + `/qms/notes/buildings/${cleanedBuildingId}`).subscribe({
      next: (data) => {
        this.comments.next({
          loading: false,
          comments: data
        });
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments.next({
          loading: false,
          comments: { notesDTO: [] }
        });
      }
    });
  }

  public saveComment(comment: CreateComment) {
    if (!comment.bldId || !comment.noteText) {
      console.warn('Building ID and comment text are required to save a comment');
      this.matSnackBar.open('Building ID and comment text are required', 'Ok', {
        duration: 3000
      });
      return;
    }
    this.savingComment.next(true);
    this.httpClient.post(environment.base_url + "/qms/notes", comment).subscribe({
      next: () => {
        this.loadComments(comment.bldId);
        this.savingComment.next(false);
        this.matSnackBar.open('Comment saved successfully', 'Ok', {
          duration: 3000
        });
      },
      error: (error) => {
        this.savingComment.next(false);
        console.error('Error saving comment:', error);
        this.matSnackBar.open('Could not save comment. Please try again', 'Ok', {
          duration: 3000
        });
      }
    })
  }

  public deleteComment(buildingId: string, commentId: number) {
    const url = `${environment.base_url}/qms/notes/${commentId}`;
    this.httpClient.delete(url).subscribe({
      next: () => {
        this.matSnackBar.open('Comment deleted successfully', 'Ok', {
          duration: 3000
        });
        // Reload comments after deletion
        this.loadComments(buildingId);
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.matSnackBar.open('Could not delete comment. Please try again', 'Ok', {
          duration: 3000
        });
      }
    });
  }
}

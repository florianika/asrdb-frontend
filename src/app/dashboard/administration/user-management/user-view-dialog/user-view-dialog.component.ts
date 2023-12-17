import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserManagementService } from '../user-management.service';

@Component({
  selector: 'asrdb-user-view-dialog',
  templateUrl: './user-view-dialog.component.html',
  styleUrls: ['./user-view-dialog.component.css']
})
export class UserViewDialogComponent implements OnInit{
  user = this.userService.userAsObservable;

  constructor(private userService: UserManagementService, @Inject(MAT_DIALOG_DATA) public data: {userId: string}) {

  }

  ngOnInit(): void {
    this.userService.getUser(this.data.userId);
  }
}

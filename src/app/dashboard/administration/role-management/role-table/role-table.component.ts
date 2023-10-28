import {AfterViewInit, Component, Input, ViewChild} from '@angular/core';
import {Role, RolePermissions} from "../../../../model/RolePermissions.model";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {RoleManagementService} from "../role-management.service";
import {Observable} from "rxjs";

@Component({
  selector: 'asrdb-role-table',
  templateUrl: './role-table.component.html',
  styleUrls: ['./role-table.component.css']
})
export class RoleTableComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'role', 'entityType', 'variableName', 'permission', 'actions'];
  resultsLength = 0;
  isLoadingResults: Observable<boolean> = this.roleManagementService.loadingAsObservable;

  @Input() role!: Role;
  @Input() dataSource!: MatTableDataSource<RolePermissions>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private roleManagementService: RoleManagementService) {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  editAccount(row: RolePermissions) {

  }

  deleteRow(row: RolePermissions) {
    this.roleManagementService.openDeleteRoleDialog(row);
  }
}

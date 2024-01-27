import {Component, OnInit} from '@angular/core';
import {map, Observable} from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {Role, RolePermissions} from '../../../model/RolePermissions.model';
import {RoleManagementService} from './role-management.service';

@Component({
  selector: 'asrdb-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  datasourceToUse: Role = 'ADMIN';
  dataSourceObservable: Observable<Map<Role, MatTableDataSource<RolePermissions>>> = this.roleManagementService
    .rolesAsObservable
    .pipe(
      map(rolePermissions => {
        const rolePermissionGroups = new Map<Role, RolePermissions[]>([
          ['USER', []],
          ['ADMIN', []],
          ['SUPERVISOR', []],
          ['ENUMERATOR', []],
          ['CLIENT', []],
          ['PUBLISHER', []],
        ]);
        rolePermissions.forEach(rolePermission => {
          rolePermissionGroups.get(rolePermission.role)?.push(rolePermission);
        });
        const dataSources = this.dataSources;
        dataSources.forEach((dataSource, key) => {
          dataSource.data = rolePermissionGroups.get(key) ?? [];
        });
        return dataSources;
      })
  );

  private dataSources: Map<Role, MatTableDataSource<RolePermissions>> = new Map([
    ['USER', new MatTableDataSource()],
    ['ADMIN', new MatTableDataSource()],
    ['SUPERVISOR', new MatTableDataSource()],
    ['ENUMERATOR', new MatTableDataSource()],
    ['CLIENT', new MatTableDataSource()],
    ['PUBLISHER', new MatTableDataSource()],
  ]);

  constructor(private roleManagementService: RoleManagementService) {
  }

  ngOnInit(): void {
    this.roleManagementService.getRolePermissions();
  }

  getDatasource(): MatTableDataSource<RolePermissions> {
    return this.dataSources.get(this.datasourceToUse) ?? new MatTableDataSource<RolePermissions>();
  }

  createRole() {
    this.roleManagementService.openCreateRoleDialog();
  }

  updateRole() {
    throw new Error('Not implemented');
  }
}

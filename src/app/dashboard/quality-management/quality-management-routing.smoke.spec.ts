import { QualityManagementEditComponent } from './quality-management-edit/quality-management-edit.component';
import { QualityManagementTableComponent } from './quality-management-table/quality-management-table.component';
import { QUALITY_MANAGEMENT_ROUTES } from './quality-management-routing.module';

describe('QualityManagementRouting (smoke)', () => {
  it('contains create and edit flows wired to edit component', () => {
    const createRoute = QUALITY_MANAGEMENT_ROUTES.find(
      route => route.path === ':entity/create'
    );
    const editRoute = QUALITY_MANAGEMENT_ROUTES.find(
      route => route.path === ':entity/edit/:id'
    );
    const editWithoutIdRoute = QUALITY_MANAGEMENT_ROUTES.find(
      route => route.path === ':entity/edit'
    );

    expect(createRoute?.component).toBe(QualityManagementEditComponent);
    expect(editRoute?.component).toBe(QualityManagementEditComponent);
    expect(editWithoutIdRoute?.component).toBe(QualityManagementEditComponent);
  });

  it('contains table flow wired to table component', () => {
    const tableRoute = QUALITY_MANAGEMENT_ROUTES.find(
      route => route.path === ':entity'
    );

    expect(tableRoute?.component).toBe(QualityManagementTableComponent);
  });
});

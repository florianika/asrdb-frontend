import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StreetManagementService } from './street-creation.service';
import { CommonStreetService } from '../../common/service/common-street.service';
import { CommonEntranceService } from '../../common/service/common-entrance.service';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { Street } from '../model/street';

describe('StreetManagementService (smoke)', () => {
  const currentStreetId = '{BC69F251-2D94-44D3-809F-4DB27735C605}';
  const existingStreetId = '{E74CA133-E3E5-4C38-B774-969FEC6A7CEF}';
  let service: StreetManagementService;
  let commonStreetService: jasmine.SpyObj<CommonStreetService>;
  let commonEntranceService: jasmine.SpyObj<CommonEntranceService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let authState: jasmine.SpyObj<AuthStateService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const baseStreet: Street = {
    OBJECTID: 1,
    StrMunicipality: 53,
    StrType: 1,
    StrNameCore: 'Sample Street',
    StrNameFull: 'Sample Street',
    StrAddressID: 100,
    GlobalID: currentStreetId,
    created_user: 'user',
    created_date: 0,
    last_edited_user: 'user',
    last_edited_date: 0,
    external_creator: '',
    external_creator_date: '',
    external_editor: '',
    external_editor_date: '',
  };

  beforeEach(() => {
    commonStreetService = jasmine.createSpyObj<CommonStreetService>(
      'CommonStreetService',
      ['getStreets', 'createFeature', 'updateFeature', 'deleteFeature']
    );
    commonEntranceService = jasmine.createSpyObj<CommonEntranceService>(
      'CommonEntranceService',
      ['mergeEntrances']
    );
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    authState = jasmine.createSpyObj<AuthStateService>('AuthStateService', [
      'getNameId',
    ]);
    matDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    authState.getNameId.and.returnValue('user-1');

    service = new StreetManagementService(
      commonStreetService,
      commonEntranceService,
      snackBar,
      authState,
      matDialog
    );
  });

  it('merges duplicate street and deletes current street on confirm', () => {
    commonStreetService.getStreets.and.returnValue(
      of({
        count: 1,
        data: {
          features: [{ attributes: { GlobalID: existingStreetId } }],
        },
      } as never)
    );
    matDialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as never);
    commonStreetService.deleteFeature.and.returnValue(of({} as never));
    commonEntranceService.mergeEntrances.and.callFake(
      (_existingStreetId, _foundStreetIds, callback) => {
        callback?.(true);
      }
    );

    service.saveStreet({ ...baseStreet });

    expect(commonEntranceService.mergeEntrances).toHaveBeenCalledWith(
      currentStreetId,
      existingStreetId,
      jasmine.any(Function)
    );
    expect(commonStreetService.deleteFeature).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
  });
});

import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthStateService } from './common/services/auth-state.service';

describe('AppComponent (smoke)', () => {
  it('should create the component class', () => {
    const authStateMock: Pick<AuthStateService, 'getLoginStateAsObservable'> = {
      getLoginStateAsObservable: () => of(false),
    };

    const component = new AppComponent(authStateMock as AuthStateService);
    expect(component).toBeTruthy();
    expect(component.title).toBe('asrdb-frontend');
  });
});

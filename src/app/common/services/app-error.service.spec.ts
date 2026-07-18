import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { AppErrorService } from './app-error.service';

describe('AppErrorService', () => {
  const service = new AppErrorService();

  it('classifies network failures', () => {
    const error = new HttpErrorResponse({ status: 0, url: '/buildings' });

    const result = service.normalize(error);

    expect(result.kind).toBe('network');
    expect(result.status).toBe(0);
    expect(result.url).toBe('/buildings');
  });

  it('classifies forbidden responses', () => {
    const error = new HttpErrorResponse({ status: 403 });

    expect(service.normalize(error).kind).toBe('forbidden');
  });

  it('classifies RxJS timeouts', () => {
    expect(service.normalize(new TimeoutError()).kind).toBe('timeout');
  });
});

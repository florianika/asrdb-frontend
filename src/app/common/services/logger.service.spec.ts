import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  it('logs the same error object only once', () => {
    const consoleError = spyOn(console, 'error');
    const logger = new LoggerService();
    const error = new Error('request failed');

    logger.error('First handler', error);
    logger.error('Second handler', error);

    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

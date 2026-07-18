export type AppErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'server'
  | 'timeout'
  | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  message: string;
  status?: number;
  url?: string;
  cause: unknown;
}

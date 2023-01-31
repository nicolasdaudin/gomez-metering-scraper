import { DateTime } from 'luxon';

export interface INotifier<T> {
  report: T;
  notify(to: string, date: DateTime): Promise<void>;
}

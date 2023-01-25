import { DateTime } from 'luxon';
import { IMeasure } from '../measure/IMeasure';
import { IReport } from '../report/IReport';

export interface Notifier<T extends IReport<IMeasure>> {
  report: T;
  notify(to: string, date: DateTime): Promise<void>;
}

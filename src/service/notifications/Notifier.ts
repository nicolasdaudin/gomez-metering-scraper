import { IMeasure } from '../measure/IMeasure';

export interface Notifier<T extends IMeasure> {
  notify(to: string, data: T[]): Promise<void>;
}

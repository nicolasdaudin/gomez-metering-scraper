import { IMeasure } from '../measure/IMeasure';

export interface Reader<T extends IMeasure> {
  read(): Promise<T[]>;
}

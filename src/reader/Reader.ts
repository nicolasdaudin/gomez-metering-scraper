import { IMeasure } from './IMeasure';

export interface Reader<T extends IMeasure> {
  read(): Promise<T[]>;
}

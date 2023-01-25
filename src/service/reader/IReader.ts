import { IMeasure } from '../measure/IMeasure';

export interface IReader<T extends IMeasure> {
  read(): Promise<T[]>;
}

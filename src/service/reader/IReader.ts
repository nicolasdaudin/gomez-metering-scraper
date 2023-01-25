import { IMeasure } from '../measure/IMeasure';

export interface IReader<T extends IMeasure> {
  read(days: number): Promise<T[]>;
}

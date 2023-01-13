import { Measure } from './Measure';

export interface Reader<T extends Measure> {
  read(): Promise<T[]>;
}

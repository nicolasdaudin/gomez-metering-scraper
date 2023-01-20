import { DateTime } from 'luxon';

export interface IMeasure {
  deviceSerialNumber: number;
  measureDate: DateTime;
  measure: number;
  consumption: number;
}

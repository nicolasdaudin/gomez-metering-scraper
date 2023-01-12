import { DateTime } from 'luxon';

export interface Measure {
  deviceSerialNumber: number;
  measureDate: DateTime;
  measure: number;
  consumption: number;
}

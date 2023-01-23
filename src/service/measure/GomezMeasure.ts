import { DateTime } from 'luxon';
import { IMeasure } from './IMeasure';

export class GomezMeasure implements IMeasure {
  static fromString({
    deviceSerialNumber,
    measureDate,
    measure,
    consumption,
  }: {
    deviceSerialNumber: string;
    measureDate: string;
    measure: string;
    consumption: string;
  }): IMeasure {
    return new GomezMeasure(
      +deviceSerialNumber,
      DateTime.fromFormat(measureDate, `dd'/'MM'/'yyyy`), // parsing things like '11/01/2023' for 11 January 2023
      parseFloat(measure),
      parseFloat(consumption)
    );
  }

  constructor(
    public deviceSerialNumber: number,
    public measureDate: DateTime,
    public measure: number,
    public consumption: number
  ) {}
}

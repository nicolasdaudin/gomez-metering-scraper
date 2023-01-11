import { Measure } from './Measure';

export class GomezMeasure implements Measure {
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
  }): Measure {
    return new GomezMeasure(
      +deviceSerialNumber,
      new Date(measureDate),
      parseFloat(measure),
      parseFloat(consumption)
    );
  }

  constructor(
    public deviceSerialNumber: number,
    public measureDate: Date,
    public measure: number,
    public consumption: number
  ) {}
}

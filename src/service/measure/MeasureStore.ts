import Device from '../../model/Device';
import Measure from '../../model/Measure';
import { GomezMeasure } from './GomezMeasure';

export class MeasureStore {
  static async save(measures: GomezMeasure[]): Promise<void> {
    for (const measure of measures) {
      const device = await Device.findBySerialNumber(
        measure.deviceSerialNumber
      );

      // only inserts if the measure does not exist yet
      // measure do not change on the remote Gomez website so no need to scrap them again.
      const similar = await Measure.findOne({
        device,
        measureDate: measure.measureDate,
      });
      if (similar) {
        console.log(
          `DB: Measure already exists: device ${device.location}, date : ${measure.measureDate}`
        );
      } else {
        const doc = await Measure.create({
          device,
          measureDate: measure.measureDate,
          measure: measure.measure,
          consumption: measure.consumption,
        });
        console.log(
          `DB: Inserted new Measure with ${doc._id}, device ${device.location}, date : ${measure.measureDate}`
        );
      }
    }
  }
}

import { MongoBulkWriteError } from 'mongodb';
import Device from '../../model/Device';
import Measure from '../../model/Measure';
import { GomezMeasure } from './GomezMeasure';

export class MeasureStore {
  static async update(measures: GomezMeasure[]): Promise<void> {
    // console.log('Nb of docs to update', measures.length);
    for (const measure of measures) {
      const device = await Device.findBySerialNumber(
        measure.deviceSerialNumber
      );

      const updated = await Measure.updateOne(
        {
          device: device,
          measureDate: {
            $gte: measure.measureDate.startOf('day'),
            $lte: measure.measureDate.endOf('day'),
          },
        },
        { consumption: measure.consumption }
      );

      console.log(
        `One measure for date ${measure.measureDate.toString()} and device ${
          device.location
        } has been updated with new consumption ${measure.consumption} ?`,
        updated.modifiedCount > 0
      );
    }
  }
  static async save(measures: GomezMeasure[]): Promise<void> {
    // prepare docs
    const docs = await Promise.all(
      measures.map(async (measure) => {
        const device = await Device.findBySerialNumber(
          measure.deviceSerialNumber
        );

        return {
          device,
          measureDate: measure.measureDate,
          measure: measure.measure,
          consumption: measure.consumption,
        };
      })
    );

    console.log('Nb of docs to insert', docs.length);

    try {
      const inserted = await Measure.insertMany(docs, { ordered: false });
      console.log('Nb of docs ACTUALLY INSERTED: ', inserted.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // an error is caught when using insertMany with options ordered=false
      // when there are duplicated :
      // other non-duplicated docs are correctly inserted but errors are reported at the end.

      // for some reasons 'error instance of MongoBulkWriteError' does not work even if the error is a MongoBulkWriteError
      // so we need to fake it and force it
      if (error.name === 'MongoBulkWriteError') {
        // if (error instanceof MongoServerError) {
        // if (error instanceof MongoBulkWriteError) {
        // if (error instanceof MongoBulkWriteError.constructor.prototype) {
        // if (error?.constructor.name === 'MongoBulkWriteError') {
        console.error(
          `Error while inserting Measures : ${
            (error as MongoBulkWriteError).result.getWriteErrors().length
          } not inserted (probably duplicated) and ${
            (error as MongoBulkWriteError).result.nInserted
          } correctly inserted`
        );
      } else {
        console.error(
          'Unexpected Error while inserting Measures :',
          error.message
        );
      }
    }
  }
}

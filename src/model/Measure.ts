import { DateTime } from 'luxon';
import { Schema, model, Model } from 'mongoose';
import Device from './Device';

interface MeasurePOJO {
  device: typeof Device;
  measureDate: DateTime;
  measure: number;
  consumption: number;
}

interface MeasureModel extends Model<MeasurePOJO> {
  aggregateConsumptionByMonthAndDevice(): {
    month: string;
    totalConsumption: number;
    location: string;
  }[];

  aggregateConsumptionByMonth(): {
    month: string;
    totalConsumption: number;
  }[];

  aggregateConsumptionByDay(): {
    day: string;
    totalConsumption: number;
  }[];
}

const measureSchema = new Schema<MeasurePOJO, MeasureModel>(
  {
    device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    measureDate: { type: Date, required: true },
    measure: { type: Number, required: true },
    consumption: { type: Number, required: true },
  },
  { timestamps: true }
);

measureSchema.index({ device: 1, measureDate: 1 }, { unique: true });

measureSchema.static(
  'aggregateConsumptionByMonthAndDevice',
  async function aggregateConsumptionByMonthAndDevice() {
    const result = await Measure.aggregate()
      .group({
        _id: {
          date: { $dateToString: { format: '%Y-%m', date: '$measureDate' } },
          device: '$device',
        },
        totalConsumption: { $sum: '$consumption' },
      })
      .lookup({
        from: 'devices',
        localField: '_id.device',
        foreignField: '_id',
        as: 'deviceObject',
      })
      .replaceRoot({
        $mergeObjects: [{ $arrayElemAt: ['$deviceObject', 0] }, '$$ROOT'],
      })
      .addFields({
        month: '$_id.date',
      })
      .project({ _id: 0, deviceObject: 0, serialNumber: 0 })
      .sort('month location');

    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByMonth',
  async function aggregateConsumptionByMonth() {
    const result = await Measure.aggregate()
      .group({
        _id: {
          date: { $dateToString: { format: '%Y-%m', date: '$measureDate' } },
        },
        totalConsumption: { $sum: '$consumption' },
      })

      .addFields({
        month: '$_id.date',
      })
      .project({ _id: 0 })
      .sort('month');

    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByDay',
  async function aggregateConsumptionByDay() {
    const result = await Measure.aggregate()
      .group({
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$measureDate' } },
        },
        totalConsumption: { $sum: '$consumption' },
      })

      .addFields({
        day: '$_id.date',
      })
      .project({ _id: 0 })
      .sort('-day');

    return result;
  }
);

const Measure = model<MeasurePOJO, MeasureModel>('Measure', measureSchema);
export default Measure;

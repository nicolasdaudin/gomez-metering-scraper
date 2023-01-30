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
    weightedConsumption: number;
    location: string;
  }[];

  aggregateConsumptionByMonth(): {
    month: string;
    weightedConsumption: number;
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
      .lookup({
        from: 'devices',
        localField: 'device',
        foreignField: '_id',
        as: 'deviceObject',
      })
      .replaceRoot({
        $mergeObjects: [{ $arrayElemAt: ['$deviceObject', 0] }, '$$ROOT'],
      })
      .group({
        _id: {
          date: { $dateToString: { format: '%Y-%m', date: '$measureDate' } },
          location: '$location',
        },
        totalConsumption: {
          $sum: '$consumption',
        },
        ponderedConsumption: {
          $sum: { $multiply: ['$consumption', '$coefficient'] },
        },
      })

      .addFields({
        month: '$_id.date',
        location: '$_id.location',
        weightedConsumption: { $round: ['$ponderedConsumption', 2] },
      })
      .project({
        _id: 0,
        ponderedConsumption: 0,
      })
      .sort('-month location');
    console.log(result);
    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByMonth',
  async function aggregateConsumptionByMonth() {
    const result = await Measure.aggregate()
      .lookup({
        from: 'devices',
        localField: 'device',
        foreignField: '_id',
        as: 'deviceObject',
      })
      .replaceRoot({
        $mergeObjects: [{ $arrayElemAt: ['$deviceObject', 0] }, '$$ROOT'],
      })
      .group({
        _id: {
          date: { $dateToString: { format: '%Y-%m', date: '$measureDate' } },
        },
        totalConsumption: {
          $sum: '$consumption',
        },
        ponderedConsumption: {
          $sum: { $multiply: ['$consumption', '$coefficient'] },
        },
      })
      .addFields({
        month: '$_id.date',
        weightedConsumption: { $round: ['$ponderedConsumption', 2] },
      })
      .project({ _id: 0, ponderedConsumption: 0 })
      .sort('-month');
    console.log(result);

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

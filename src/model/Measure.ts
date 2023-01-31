import { DateTime } from 'luxon';
import { Schema, model, Model } from 'mongoose';
import Device from './Device';
import { AggregateByDayAndDevice } from './MeasureAggregate';
import {
  addCostFields,
  addDateFields,
  addLocationField,
  lookupDefaultEnergyCost,
  lookupDevices,
  lookupDailyEnergyCost,
  groupByDateAndDevice,
  groupByMonthAndDevice,
} from './MeasurePipeline';

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
    costForTheMonth: number;
  }[];

  aggregateConsumptionByMonth(): {
    month: string;
    weightedConsumption: number;
    totalConsumption: number;
    costForTheMonth: number;
  }[];

  aggregateConsumptionByDay(): {
    day: string;
    weightedConsumption: number;
    totalConsumption: number;
    unitCost: number;
    costForTheDay: number;
  }[];

  aggregateConsumptionByDayAndDevice(day: DateTime): AggregateByDayAndDevice[];
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
    const result = await Measure.aggregate([
      ...lookupDevices,
      ...groupByDateAndDevice(true),
      ...lookupDailyEnergyCost,
      ...lookupDefaultEnergyCost,
      ...addDateFields,
      ...addCostFields,
      ...addLocationField,
      ...groupByMonthAndDevice(true),

      {
        $addFields: {
          month: '$_id.date',
          location: '$_id.location',
        },
      },
      {
        $sort: {
          month: -1,
          location: 1,
        },
      },
    ]);
    console.log(result);
    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByMonth',
  async function aggregateConsumptionByMonth() {
    const result = await Measure.aggregate([
      ...lookupDevices,
      ...groupByDateAndDevice(),
      ...lookupDailyEnergyCost,
      ...lookupDefaultEnergyCost,
      ...addDateFields,
      ...addCostFields,
      ...groupByMonthAndDevice(),
      {
        $addFields: {
          month: '$_id.date',
        },
      },
      {
        $sort: {
          month: -1,
        },
      },
    ]);
    console.log(result);

    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByDay',
  async function aggregateConsumptionByDay() {
    const result = await Measure.aggregate([
      ...lookupDevices,
      ...groupByDateAndDevice(),
      ...lookupDailyEnergyCost,
      ...lookupDefaultEnergyCost,
      ...addDateFields,
      ...addCostFields,
      {
        $project: {
          totalConsumption: 1,
          weightedConsumption: 1,
          costForTheDay: 1,
          unitCost: 1,
          day: 1,
          isoDate: 1,
        },
      },
      {
        $sort: {
          day: -1,
        },
      },
    ]);

    console.log(result.slice(0, 50));
    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionByDayAndDevice',
  async function aggregateConsumptionByDayAndDevice(day: DateTime) {
    const result = await Measure.aggregate([
      {
        $match: {
          measureDate: {
            $gte: day,
            $lte: day.plus({ days: 1 }),
          },
        },
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'device',
          foreignField: '_id',
          as: 'deviceObject',
        },
      },
      {
        $addFields: {
          thisDevice: {
            $arrayElemAt: ['$deviceObject', 0],
          },
        },
      },
      {
        $lookup: {
          from: 'energycosts',
          pipeline: [
            {
              $sort: {
                endDate: 1,
              },
            },
          ],
          as: 'allCosts',
        },
      },
      {
        $addFields: {
          defaultCostObject: {
            $last: '$allCosts',
          },
        },
      },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$measureDate',
            },
          },
          location: '$thisDevice.location',
          unitCost: '$defaultCostObject.cost',
          costForTheDay: {
            $multiply: [
              '$consumption',
              '$defaultCostObject.cost',
              '$thisDevice.coefficient',
            ],
          },
          coefficient: '$thisDevice.coefficient',
        },
      },
      {
        $project: {
          day: 1,
          unitCost: 1,
          costForTheDay: 1,
          consumption: 1,
          location: 1,
          coefficient: 1,
        },
      },
      {
        $sort: {
          location: 1,
        },
      },
    ]);
    console.log(result);
    return result;
  }
);

const Measure = model<MeasurePOJO, MeasureModel>('Measure', measureSchema);
export default Measure;

import { DateTime } from 'luxon';
import { Schema, model, Model } from 'mongoose';
import Device from './Device';
import {
  AggregateByDayAndDevice,
  AggregateByMonth,
  AggregateSinceLastInvoice,
} from './MeasureAggregate';
import {
  addCostFields,
  addDateFields,
  addLocationField,
  lookupLastEnergyCost,
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

  aggregateConsumptionByMonth(): AggregateByMonth[];

  aggregateConsumptionByDay(): {
    day: string;
    weightedConsumption: number;
    totalConsumption: number;
    unitCost: number;
    costForTheDay: number;
  }[];

  aggregateConsumptionByDayAndDevice(day: DateTime): AggregateByDayAndDevice[];

  aggregateConsumptionByGomezInvoice(): {
    beginDay: string;
    endDay: string;
    consumption: number;
    costForThePeriod: number;
    location: string;
  }[];

  aggregateConsumptionSinceLastInvoice(): AggregateSinceLastInvoice[];
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
      ...lookupDailyEnergyCost(),
      ...lookupLastEnergyCost,
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
      ...lookupDailyEnergyCost(),
      ...lookupLastEnergyCost,
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
      ...lookupDailyEnergyCost(),
      ...lookupLastEnergyCost,
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
  // FIXME: this will not work for days other than yesterday since it takes the last eenrgy cost (and should take either the cost for that day or if it does not exis, the last known cost)
  async function aggregateConsumptionByDayAndDevice(day: DateTime) {
    const result = await Measure.aggregate([
      {
        // only get measures for that particular day
        $match: {
          measureDate: {
            $gte: day,
            $lte: day.plus({ days: 1 }),
          },
        },
      },
      ...lookupDevices,
      ...lookupLastEnergyCost,
      {
        $addFields: {
          day: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$measureDate',
            },
          },
          location: '$thisDevice.location',
          unitCost: '$lastEnergyCost.cost',
          // calculate cost for that day, multiplying the device consumption, the coefficient for that device and the cost for that day
          costForTheDay: {
            $multiply: [
              '$consumption',
              '$lastEnergyCost.cost',
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

measureSchema.static(
  'aggregateConsumptionByGomezInvoice',
  async function aggregateConsumptionByGomezInvoice() {
    const result = await Measure.aggregate([
      ...lookupDevices,
      ...lookupDailyEnergyCost('$measureDate'),
      {
        // only keep objects which had a corresponding cost
        $match: {
          initCostObject: {
            $exists: true,
          },
        },
      },
      {
        // filter by energy cost dates (= invoice dates)
        // and sums consumption and costs for these periods
        $group: {
          _id: {
            beginDate: '$initCostObject.beginDate',
            endDate: '$initCostObject.endDate',
            location: '$thisDevice.location',
          },
          consumption: {
            $sum: '$consumption',
          },
          costForThePeriod: {
            $sum: {
              $multiply: [
                '$consumption',
                '$thisDevice.coefficient',
                '$initCostObject.cost',
              ],
            },
          },
        },
      },
      {
        $addFields: {
          beginDay: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$_id.beginDate',
            },
          },
          endDay: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$_id.endDate',
            },
          },
          location: '$_id.location',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          beginDay: 1,
          location: 1,
        },
      },
    ]);
    console.log(result);
    return result;
  }
);

measureSchema.static(
  'aggregateConsumptionSinceLastInvoice',
  async function aggregateConsumptionSinceLastInvoice() {
    const result = await Measure.aggregate([
      ...lookupDevices,
      ...groupByDateAndDevice(),
      ...lookupLastEnergyCost,
      ...addDateFields,
      {
        $addFields: {
          lastCost: '$lastEnergyCost.cost',
          lastInvoiceDate: '$lastEnergyCost.endDate',
        },
      },
      {
        // only get measures that have their date after the last invoice date
        $match: {
          $expr: {
            $gte: ['$isoDate', '$lastInvoiceDate'],
          },
        },
      },
      {
        // computes value for this day
        $addFields: {
          costForTheDay: {
            sum: {
              $multiply: ['$lastCost', '$weightedConsumption'],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalConsumption: {
            $sum: '$totalConsumption',
          },
          weightedConsumption: {
            $sum: '$weightedConsumption',
          },
          totalCost: {
            $sum: {
              $multiply: ['$weightedConsumption', '$lastCost'],
            },
          },
          lastInvoiceDate: {
            $max: '$lastInvoiceDate',
          },
          lastCost: {
            $max: '$lastCost',
          },
        },
      },
    ]);
    console.log(result);
    return result;
  }
);

const Measure = model<MeasurePOJO, MeasureModel>('Measure', measureSchema);
export default Measure;

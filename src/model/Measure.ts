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
    const result = await Measure.aggregate([
      {
        // first get the corresponding devices
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
        // aggregate by date (by day, not by month yet) and device
        // and calculate total consumption
        $group: {
          _id: {
            date: '$measureDate',
            location: '$thisDevice.location',
          },
          totalConsumption: {
            $sum: '$consumption',
          },
          weightedConsumption: {
            $sum: {
              $multiply: ['$consumption', '$thisDevice.coefficient'],
            },
          },
        },
      },
      {
        // look for the corresponding energy cost for each day
        // energy costs are values stored between a begin and end date
        $lookup: {
          from: 'energycosts',
          let: {
            measureMeasureDate: '$_id.date',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $lte: ['$beginDate', '$$measureMeasureDate'],
                    },
                    {
                      $gte: ['$endDate', '$$measureMeasureDate'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'cost',
        },
      },
      {
        // we get the cost from the corresponding array we got at the previous step
        $addFields: {
          initCostObject: {
            $arrayElemAt: ['$cost', 0],
          },
        },
      },
      {
        // we again look at energy csots but this time we want to get all energy costs
        // and retrieve the 'last' defined energy cost (last by date)
        // the last will be the default energy costs when no energy costs are defined
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
              date: '$_id.date',
            },
          },
          isoDate: '$_id.date',
          location: '$_id.location',
          // compute values for unit costs and cost for the day
          // using default values if needed
          unitCost: {
            $ifNull: ['$initCostObject.cost', '$defaultCostObject.cost'],
          },
          costForTheDay: {
            $ifNull: [
              {
                $multiply: ['$weightedConsumption', '$initCostObject.cost'],
              },
              {
                $multiply: ['$weightedConsumption', '$defaultCostObject.cost'],
              },
            ],
          },
        },
      },
      {
        // finally group by month!
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m',
                date: '$isoDate',
              },
            },
            location: '$location',
          },
          totalConsumption: {
            $sum: '$totalConsumption',
          },
          weightedConsumption: {
            $sum: '$weightedConsumption',
          },
          costForTheMonth: {
            $sum: '$costForTheDay',
          },
        },
      },
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
      {
        // first get the corresponding devices
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
        // aggregate by date (by day, not by month yet)
        // and calculate total consumptions

        $group: {
          _id: {
            date: '$measureDate',
          },
          totalConsumption: {
            $sum: '$consumption',
          },
          weightedConsumption: {
            $sum: {
              $multiply: ['$consumption', '$thisDevice.coefficient'],
            },
          },
        },
      },
      {
        // look for the corresponding energy cost for each day
        // energy costs are values stored between a begin and end date
        $lookup: {
          from: 'energycosts',
          let: {
            measureMeasureDate: '$_id.date',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $lte: ['$beginDate', '$$measureMeasureDate'],
                    },
                    {
                      $gte: ['$endDate', '$$measureMeasureDate'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'cost',
        },
      },

      {
        // we get the cost from the corresponding array we got at the previous step
        $addFields: {
          initCostObject: {
            $arrayElemAt: ['$cost', 0],
          },
        },
      },
      {
        // we again look at energy csots but this time we want to get all energy costs
        // and retrieve the 'last' defined energy cost (last by date)
        // the last will be the default energy costs when no energy costs are defined
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
              date: '$_id.date',
            },
          },
          isoDate: '$_id.date',
          // compute values for unit costs and cost for the day
          // using default values if needed
          unitCost: {
            $ifNull: ['$initCostObject.cost', '$defaultCostObject.cost'],
          },
          costForTheDay: {
            $ifNull: [
              {
                $multiply: ['$weightedConsumption', '$initCostObject.cost'],
              },
              {
                $multiply: ['$weightedConsumption', '$defaultCostObject.cost'],
              },
            ],
          },
        },
      },
      {
        // finally group by month!

        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m',
                date: '$isoDate',
              },
            },
          },
          totalConsumption: {
            $sum: '$totalConsumption',
          },
          weightedConsumption: {
            $sum: '$weightedConsumption',
          },
          costForTheMonth: {
            $sum: '$costForTheDay',
          },
        },
      },
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
      {
        // first get the corresponding devices
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
        // aggregate by date (by day, not by month yet)
        // and calculate total consumptions

        $group: {
          _id: {
            date: '$measureDate',
          },
          totalConsumption: {
            $sum: '$consumption',
          },
          weightedConsumption: {
            $sum: {
              $multiply: ['$consumption', '$thisDevice.coefficient'],
            },
          },
        },
      },
      {
        // look for the corresponding energy cost for each day
        // energy costs are values stored between a begin and end date
        $lookup: {
          from: 'energycosts',
          let: {
            measureMeasureDate: '$_id.date',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $lte: ['$beginDate', '$$measureMeasureDate'],
                    },
                    {
                      $gte: ['$endDate', '$$measureMeasureDate'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'cost',
        },
      },
      {
        // we get the cost from the corresponding array we got at the previous step

        $addFields: {
          initCostObject: {
            $arrayElemAt: ['$cost', 0],
          },
        },
      },
      {
        // we again look at energy csots but this time we want to get all energy costs
        // and retrieve the 'last' defined energy cost (last by date)
        // the last will be the default energy costs when no energy costs are defined
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
              date: '$_id.date',
            },
          },
          isoDate: '$_id.date',
          // compute values for unit costs and cost for the day
          // using default values if needed
          unitCost: {
            $ifNull: ['$initCostObject.cost', '$defaultCostObject.cost'],
          },
          costForTheDay: {
            $ifNull: [
              {
                $multiply: ['$weightedConsumption', '$initCostObject.cost'],
              },
              {
                $multiply: ['$weightedConsumption', '$defaultCostObject.cost'],
              },
            ],
          },
        },
      },
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

const Measure = model<MeasurePOJO, MeasureModel>('Measure', measureSchema);
export default Measure;

import { PipelineStage } from 'mongoose';

export const lookupDevices: PipelineStage[] = [
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
];

export const lookupDailyEnergyCost = function (
  dateFieldName = '$_id.date'
): PipelineStage[] {
  return [
    {
      // look for the corresponding energy cost for each day
      // energy costs are values stored between a begin and end date
      $lookup: {
        from: 'energycosts',
        let: {
          measureMeasureDate: dateFieldName,
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
  ];
};

export const lookupDefaultEnergyCost: PipelineStage[] = [
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
];

export const groupByDateAndDevice = function (
  groupByDevice = false
): PipelineStage[] {
  return [
    {
      // aggregate by date (by day, not by month yet)
      // and by location if specified
      // and calculate total consumptions

      $group: {
        _id: {
          date: '$measureDate',
          ...(groupByDevice ? { location: '$thisDevice.location' } : {}),
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
  ];
};

export const groupByMonthAndDevice = function (
  groupByDevice = false
): PipelineStage[] {
  return [
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m',
              date: '$isoDate',
            },
          },
          ...(groupByDevice ? { location: '$location' } : {}),
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
  ];
};

export const addDateFields: PipelineStage[] = [
  {
    $addFields: {
      day: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$_id.date',
        },
      },
      isoDate: '$_id.date',
    },
  },
];
export const addCostFields: PipelineStage[] = [
  {
    // compute values for unit costs and cost for the day
    $addFields:
      // using default values if needed
      {
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
];
export const addLocationField: PipelineStage[] = [
  {
    $addFields: {
      location: '$_id.location',
    },
  },
];

import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Device from '../model/Device';
import Measure from '../model/Measure';
import { GomezExtractor } from '../service/extractor/GomezExtractor';
import { MeasureStore } from '../service/measure/MeasureStore';
import { EmailNotifier } from '../service/notifications/EmailNotifier';
import { DailyEmailReport } from '../service/report/DailyEmailReport';
import { TypedRequestParam } from '../types/GomezRequest';

export const extractYesterdayMeasures = async (req: Request, res: Response) => {
  console.log('Reading from Gomez....');
  if (!process.env.GOMEZ_USER || !process.env.GOMEZ_PASSWORD) {
    res.status(500).json({
      data: [],
      message:
        'Gomez Metering credentials missing from environment variables, please init GOMEZ_USER and GOMEZ_PASSWORD',
    });
    return;
  }

  const measures = await GomezExtractor.extract(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  await MeasureStore.save(measures);

  // get consolidated info for extracted measures
  const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');

  const data = await Measure.aggregateConsumptionByDayAndDevice(yesterday);

  const notifier = new EmailNotifier(new DailyEmailReport(data, yesterday));
  await notifier.notify('nicolas.daudin@gmail.com', yesterday);

  res.status(200).json({
    message: 'Succesfully extracted data for yesterday',
    data: measures,
  });
};

export const extractHistoricalMeasures = async (
  req: TypedRequestParam<{ nbOfDaysToExtract: string }>,
  res: Response
) => {
  console.log('Reading from Gomez....');

  if (!process.env.GOMEZ_USER || !process.env.GOMEZ_PASSWORD) {
    res.status(500).json({
      data: [],
      message:
        'Gomez Metering credentials missing from environment variables, please init GOMEZ_USER and GOMEZ_PASSWORD',
    });
    return;
  }

  const measures = await GomezExtractor.extract(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD,
    +req.params.nbOfDaysToExtract
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  await MeasureStore.save(measures);

  res.status(200).json({
    message: `Succesfully extracted historic data from Gomez. Don't forget to clean out of range values at /extract/historic/clean`,
    data: measures,
  });
};

export const clean = async (req: Request, res: Response) => {
  // clean info from 18-09-2022, 13-06-2022,15-06-2022, 17-06-2022
  const updateAllDevicesUpdateResult = await Measure.updateMany(
    {
      $or: [
        {
          measureDate: {
            $gte: '2022-06-13',
            $lt: '2022-06-18',
          },
        },

        {
          measureDate: {
            $gte: '2022-09-18',
            $lt: '2022-09-19',
          },
        },
      ],
    },

    { consumption: 0 }
  );

  // clean info for baño pequeño and date 21-11-2022
  const device21112022 = await Device.findOne({ serialNumber: 30796099 });
  const updateOneDevice21112022UpdateResult = await Measure.updateMany(
    {
      measureDate: {
        $gte: '2022-11-21',
        $lt: '2022-11-22',
      },
      device: device21112022?._id,
    },
    { consumption: 0 }
  );

  // clean info for salón and date 08-03-2022
  const device08032022 = await Device.findOne({ serialNumber: 30254633 });
  const updateOneDevice08032022UpdateResult = await Measure.updateMany(
    {
      measureDate: {
        $gte: '2022-03-08',
        $lt: '2022-03-10',
      },
      device: device08032022?._id,
    },
    { consumption: 0 }
  );

  res.status(200).json({
    message: `Succesfully updated ${
      updateAllDevicesUpdateResult.modifiedCount +
      updateOneDevice08032022UpdateResult.modifiedCount +
      updateOneDevice21112022UpdateResult.modifiedCount
    } measures that were out of bound`,
    data: [],
  });
};

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
  if (
    !process.env.GOMEZ_USER ||
    !process.env.GOMEZ_PASSWORD ||
    !process.env.REPORT_EMAIL_TO
  ) {
    res.status(500).json({
      data: [],
      message:
        'Either email for reports or Gomez Metering credentials are missing from environment variables, please check environment variables, especially GOMEZ_USER, GOMEZ_PASSWORD and REPORT_EMAIL_TO',
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

  const yesterdayData = await Measure.aggregateConsumptionByDayAndDevice(
    yesterday
  );

  const byMonth = await Measure.aggregateConsumptionByMonth();

  const notifier = new EmailNotifier(
    new DailyEmailReport(yesterdayData, byMonth, yesterday)
  );
  await notifier.notify(process.env.REPORT_EMAIL_TO, yesterday);

  res.status(200).json({
    message: 'Succesfully extracted data for yesterday',
    data: yesterdayData,
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
            $gte: '2022-06-12',
            $lt: '2022-06-19',
          },
        },

        {
          measureDate: {
            $gte: '2022-09-18',
            $lt: '2022-09-20',
          },
        },
      ],
    },

    { consumption: 0 }
  );

  // clean info for baño pequeño and date 22-11-2022
  const device22112022 = await Device.findOne({ serialNumber: 30796099 });
  const updateOneDevice22112022UpdateResult = await Measure.updateMany(
    {
      measureDate: {
        $gte: '2022-11-22',
        $lt: '2022-11-23',
      },
      device: device22112022?._id,
    },
    { consumption: 0 }
  );

  // clean info for salón and date 08-03-2022
  const device08032022 = await Device.findOne({ serialNumber: 30254633 });
  const updateOneDevice08032022UpdateResult = await Measure.updateMany(
    {
      measureDate: {
        $gte: '2022-03-08',
        $lt: '2022-03-11',
      },
      device: device08032022?._id,
    },
    { consumption: 0 }
  );

  res.status(200).json({
    message: `Succesfully updated ${
      updateAllDevicesUpdateResult.modifiedCount +
      updateOneDevice08032022UpdateResult.modifiedCount +
      updateOneDevice22112022UpdateResult.modifiedCount
    } measures that were out of bound`,
    data: [],
  });
};

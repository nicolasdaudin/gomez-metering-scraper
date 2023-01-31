import { Request, Response } from 'express';
import { DateTime } from 'luxon';
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
    message: 'Succesfully extracted historic data from Gomez',
    data: measures,
  });
};

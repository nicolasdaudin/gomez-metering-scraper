import { Request, Response } from 'express';
import { LOCATIONS_FROM_ID } from '../dataset/heaterLocations';
import { GomezExtractor } from '../service/extractor/GomezExtractor';
import { MeasureStore } from '../service/measure/MeasureStore';
import { EmailNotifier } from '../service/notifications/EmailNotifier';
import { HtmlReport } from '../service/report/HtmlReport';
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

  const notifier = new EmailNotifier(
    new HtmlReport(measures.slice(0, 7), LOCATIONS_FROM_ID)
  );
  await notifier.notify('nicolas.daudin@gmail.com', measures[0].measureDate);

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

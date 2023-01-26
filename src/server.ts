import express, { Request, Response } from 'express';

import { DateTime } from 'luxon';
import { PlaywrightGomezReader } from './service/reader/PlaywrightGomezReader';

import { LOCATIONS_FROM_ID } from './dataset/heaterLocations';

import dotenv from 'dotenv';
dotenv.config();

import './db';
import { MeasureStore } from './service/measure/MeasureStore';
import { EmailNotifier } from './service/notifications/EmailNotifier';
import { HtmlReport } from './service/report/HtmlReport';
import Measure from './model/Measure';
import {
  GomezAggregateByDay,
  GomezAggregateByMonth,
  GomezAggregateByMonthAndDevice,
  TypedResponse,
} from './types/GomezResponse';
import { TypedRequestParam } from './types/GomezRequest';

const app = express();

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello Gomez Metering Scraper');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.info(
    `App started at : ${DateTime.now().setZone('Europe/Madrid').toISO()}`
  );
  console.info(`App running on listening on port ${port}`);
  console.info('###');
  console.info('### Welcome to app Gomez Metering Scraper');
  console.info('###');
});

app.get('/fetchGomez', async (req: Request, res: Response): Promise<void> => {
  console.log('Reading from Gomez....');
  if (!process.env.GOMEZ_USER || !process.env.GOMEZ_PASSWORD) {
    res.status(500).json({
      data: [],
      message:
        'Gomez Metering credentials missing from environment variables, please init GOMEZ_USER and GOMEZ_PASSWORD',
    });
    return;
  }

  const measures = await fetchGomez(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD,
    'nicolas.daudin@gmail.com'
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  await MeasureStore.save(measures);

  res.status(200).json({
    data: measures,
    message: 'Succesfully fetched data from Gomez',
  });
});

app.get(
  '/byMonthAndDevice',
  async (
    req: Request,
    res: TypedResponse<GomezAggregateByMonthAndDevice>
  ): Promise<void> => {
    const data = await Measure.aggregateConsumptionByMonthAndDevice();

    res.status(200).json({
      data,
    });
  }
);

app.get(
  '/byMonth',
  async (
    req: Request,
    res: TypedResponse<GomezAggregateByMonth>
  ): Promise<void> => {
    const data = await Measure.aggregateConsumptionByMonth();
    res.status(200).json({
      data,
    });
  }
);

app.get(
  '/byDay',
  async (
    req: Request,
    res: TypedResponse<GomezAggregateByDay>
  ): Promise<void> => {
    const data = await Measure.aggregateConsumptionByDay();
    res.status(200).json({
      data,
    });
  }
);

app.get(
  '/fetchGomez/historic/:nbOfDaysToExtract',
  async (
    req: TypedRequestParam<{ nbOfDaysToExtract: string }>,
    res: Response
  ): Promise<void> => {
    console.log('Reading from Gomez....');

    if (!process.env.GOMEZ_USER || !process.env.GOMEZ_PASSWORD) {
      res.status(500).json({
        data: [],
        message:
          'Gomez Metering credentials missing from environment variables, please init GOMEZ_USER and GOMEZ_PASSWORD',
      });
      return;
    }

    const measures = await fetchGomez(
      process.env.GOMEZ_USER,
      process.env.GOMEZ_PASSWORD,
      'nicolas.daudin@gmail.com',
      +req.params.nbOfDaysToExtract
    );
    console.log('nb of measures we got from fetchGomez', measures.length);

    await MeasureStore.save(measures);

    res.status(200).json({
      data: measures,
      message: 'Succesfully fetched data from Gomez',
    });
  }
);

async function fetchGomez(
  user: string,
  password: string,
  email: string,
  nbOfDaysToExtract = 1
) {
  const reader = new PlaywrightGomezReader(user, password);
  const measures = await reader.read(nbOfDaysToExtract);

  // const notifier = new WhatsappNotifier();
  // await notifier.notify(phonenumber, measures);

  // const notifier = new EmailNotifier(
  //   new TextReport(measures.slice(0, 7), LOCATIONS_FROM_ID)
  // );

  const notifier = new EmailNotifier(
    new HtmlReport(measures.slice(0, 7), LOCATIONS_FROM_ID)
  );
  await notifier.notify(email, measures[0].measureDate);
  return measures;
}

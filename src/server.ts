import express, { Request, Response } from 'express';

import { DateTime } from 'luxon';
import { PlaywrightGomezReader } from './service/reader/PlaywrightGomezReader';

import dotenv from 'dotenv';
dotenv.config();

import './db';
import Device from './model/Device';
import Measure from './model/Measure';
import { MeasureStore } from './service/measure/MeasureStore';
import { EmailNotifier } from './service/notifications/EmailNotifier';

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

app.get('/testdb', async (req, res) => {
  const device = await Device.create({
    serialNumber: 343434,
    location: 'test',
  });
  const measure = await Measure.create({
    device: device,
    consumption: 3,
    measure: 333,
    measureDate: DateTime.now().minus({ days: 1 }),
  });

  res.status(200).json({
    data: { device, measure },
    message: 'Succesfully created device and measure',
  });
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

  await MeasureStore.save(measures.slice(0, 10));

  res.status(200).json({
    data: measures,
    message: 'Succesfully fetched data from Gomez',
  });
});

async function fetchGomez(user: string, password: string, email: string) {
  const reader = new PlaywrightGomezReader(user, password);
  const measures = await reader.read();

  // const notifier = new WhatsappNotifier();
  // await notifier.notify(phonenumber, measures);

  const notifier = new EmailNotifier();
  await notifier.notify(email, measures);
  return measures;
}

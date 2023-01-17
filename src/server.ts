import express, { Request, Response } from 'express';
import { GomezReader } from './reader/GomezReader';
import { WhatsappNotifier } from './notifications/WhatsappNotifier';
import { CronJob } from 'cron';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello Gomez Metering Scraper');
});

app.listen(3000, () => {
  console.log('listening on port 3000');
  console.log('###');
  console.log('### Welcome to app Gomez Metering Scraper');
  console.log('###');
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
    '+34633142220'
  );

  res.status(200).json({
    data: measures,
    message: 'Succesfully fetched data from Gomez',
  });
});

async function fetchGomez(user: string, password: string, phonenumber: string) {
  const reader = new GomezReader(user, password);
  const measures = await reader.read();

  const notifier = new WhatsappNotifier();
  await notifier.notify(phonenumber, measures);
  return measures;
}

new CronJob(
  '*/5 * * * * *',
  () => {
    console.log('CRON START');
    if (process.env.GOMEZ_USER && process.env.GOMEZ_PASSWORD) {
      console.log('CRON about to call fetchGomez');
      const measures = fetchGomez(
        process.env.GOMEZ_USER,
        process.env.GOMEZ_PASSWORD,
        '+34633142220'
      );
      console.log('measures read from cron', measures);
    }
  },
  null,
  true
);

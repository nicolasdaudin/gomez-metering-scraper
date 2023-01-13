import express, { Request, Response } from 'express';
import { GomezReader } from './reader/GomezReader';

import dotenv from 'dotenv';
import { WhatsappNotifier } from './notifications/WhatsappNotifier';
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

  const reader = new GomezReader(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD
  );
  const measures = await reader.read();

  const notifier = new WhatsappNotifier();
  notifier.notify('+34633142220', measures);

  res.status(200).json({
    data: measures,
    message: 'Succesfully fetched data from Gomez',
  });
});

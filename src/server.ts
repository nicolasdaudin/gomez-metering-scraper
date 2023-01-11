import express, { Request, Response } from 'express';
import { GomezReader } from './reader/GomezReader';

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
      message: 'User and password missing from environment, please init them',
    });
    return;
  }
  const reader = new GomezReader(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD
  );
  const measures = reader.read();

  res.status(200).json({
    data: measures,
    message: 'Succesfully fetched data from Gomez',
  });
});

// see https://stackoverflow.com/questions/45093510/eslint-not-working-in-vs-code
// see https://stackoverflow.com/questions/56988147/eslint-doesnt-work-in-vscode-but-work-from-terminal

// AND THEN, README.MD + GIT

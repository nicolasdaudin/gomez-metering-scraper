import express from 'express';
import { DateTime } from 'luxon';

import dotenv from 'dotenv';
dotenv.config();

import './db';

import { router as summaryRouter } from './router/SummaryRouter';
import { router as extractRouter } from './router/ExtractRouter';
const app = express();

app.use('/summary', summaryRouter);
app.use('/extract', extractRouter);

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

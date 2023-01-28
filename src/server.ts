import express from 'express';
import { DateTime } from 'luxon';

import dotenv from 'dotenv';
dotenv.config();

import './db';

import { router as summaryRouter } from './router/SummaryRouter';
import { router as extractRouter } from './router/ExtractRouter';
import { router as energyCostRouter } from './router/EnergyCostRouter';

const app = express();
app.set('views', './src/views');
app.set('view engine', 'pug');
app.use(express.json({ limit: '10kb' })); // middleware to add body in the request data
app.use('/summary', summaryRouter);
app.use('/extract', extractRouter);
app.use('/energycost', energyCostRouter);
app.locals.dateTime = DateTime;

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

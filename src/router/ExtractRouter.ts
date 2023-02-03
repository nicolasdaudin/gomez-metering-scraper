import express, { Response, NextFunction } from 'express';
import { DateTime } from 'luxon';
import {
  extractHistoricalMeasures,
  extractYesterdayMeasures,
  updateSpecificDateMeasures,
} from '../controller/ExtractController';
import { TypedRequestParam } from '../types/GomezRequest';

const MAX_UPDATE_MEASURES_DAYS = 7;

export const router = express.Router();

const validateDate = (
  req: TypedRequestParam<{ date: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.date) {
    return next(new Error('date is missing'));
  }

  const date = DateTime.fromISO(req.params.date);
  if (!date.isValid) return next(new Error('date is invalid, please check it'));

  if (Math.abs(date.diffNow('days').as('days')) > MAX_UPDATE_MEASURES_DAYS) {
    return next(
      new Error('date is too far in time. Max 7 days before current date')
    );
  }

  next();
};

router.get('/update/:date', validateDate, updateSpecificDateMeasures);

router.get('/yesterday', extractYesterdayMeasures);

router.get('/historic/:nbOfDaysToExtract', extractHistoricalMeasures);

import { Router } from 'express';
import {
  getSummaryByDay,
  getSummaryByMonth,
  getSummaryByMonthAndDevice,
  getYesterdayMeasures,
} from '../controller/SummaryController';

export const router = Router();

router.get('/yesterday', getYesterdayMeasures);
router.get('/byMonth', getSummaryByMonth);

router.get('/byDay', getSummaryByDay);

router.get('/byMonthAndDevice', getSummaryByMonthAndDevice);

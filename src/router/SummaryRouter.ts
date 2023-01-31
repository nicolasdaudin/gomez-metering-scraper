import { Router } from 'express';
import {
  getSummaryByDay,
  getSummaryByMonth,
  getSummaryByMonthAndDevice,
  getYesterdaySummaryByDevice,
} from '../controller/SummaryController';

export const router = Router();

router.get('/yesterday', getYesterdaySummaryByDevice);
router.get('/byMonth', getSummaryByMonth);

router.get('/byDay', getSummaryByDay);

router.get('/byMonthAndDevice', getSummaryByMonthAndDevice);

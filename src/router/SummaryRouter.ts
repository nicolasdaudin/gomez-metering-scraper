import { Router } from 'express';
import {
  cleanWrongMeasures,
  getSummaryByDay,
  getSummaryByInvoice,
  getSummaryByMonth,
  getSummaryByMonthAndDevice,
  getYesterdaySummaryByDevice,
  sendYesterdaySummaryByDevice,
} from '../controller/SummaryController';

export const router = Router();

router.get('/yesterday', getYesterdaySummaryByDevice);
router.get('/yesterday/send', sendYesterdaySummaryByDevice);
router.get('/byMonth', getSummaryByMonth);

router.get('/byDay', getSummaryByDay);

router.get('/byMonthAndDevice', getSummaryByMonthAndDevice);

router.get('/byInvoice', getSummaryByInvoice);

router.get('/clean', cleanWrongMeasures);

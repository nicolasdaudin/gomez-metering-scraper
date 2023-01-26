import express from 'express';
import {
  extractHistoricalMeasures,
  extractYesterdayMeasures,
} from '../controller/ExtractController';

export const router = express.Router();

router.get('/yesterday', extractYesterdayMeasures);

router.get('/historic/:nbOfDaysToExtract', extractHistoricalMeasures);

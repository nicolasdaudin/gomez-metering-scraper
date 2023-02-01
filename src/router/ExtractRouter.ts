import express from 'express';
import {
  clean,
  extractHistoricalMeasures,
  extractYesterdayMeasures,
} from '../controller/ExtractController';

export const router = express.Router();

router.get('/yesterday', extractYesterdayMeasures);

router.get('/historic/clean', clean);

router.get('/historic/:nbOfDaysToExtract', extractHistoricalMeasures);

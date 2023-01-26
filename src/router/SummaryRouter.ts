import { Request, Router } from 'express';
import Measure from '../model/Measure';
import {
  GomezAggregateByDay,
  GomezAggregateByMonth,
  GomezAggregateByMonthAndDevice,
  TypedResponse,
} from '../types/GomezResponse';

export const router = Router();

const byMonthAndDevice = async (
  req: Request,
  res: TypedResponse<GomezAggregateByMonthAndDevice>
): Promise<void> => {
  const data = await Measure.aggregateConsumptionByMonthAndDevice();

  res.status(200).json({
    data,
  });
};

const byMonth = async (
  req: Request,
  res: TypedResponse<GomezAggregateByMonth>
): Promise<void> => {
  const data = await Measure.aggregateConsumptionByMonth();
  res.status(200).json({
    data,
  });
};

const byDay = async (
  req: Request,
  res: TypedResponse<GomezAggregateByDay>
): Promise<void> => {
  const data = await Measure.aggregateConsumptionByDay();
  res.status(200).json({
    data,
  });
};

router.get('/byMonth', byMonth);

router.get('/byDay', byDay);

router.get('/byMonthAndDevice', byMonthAndDevice);

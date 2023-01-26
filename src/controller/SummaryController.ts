import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Measure from '../model/Measure';
import { IMeasure } from '../service/measure/IMeasure';
import {
  GomezAggregateByDay,
  GomezAggregateByMonth,
  GomezAggregateByMonthAndDevice,
  TypedResponse,
} from '../types/GomezResponse';

export const getYesterdayMeasures = async (
  req: Request,
  // TODO: the following TypedResponse does not work since IMeasure has deviceSerialNumber and Measure.find does not....
  // res: TypedResponse<{ data: IMeasure[] }>
  res: Response
) => {
  const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
  const data = await Measure.find({
    measureDate: yesterday,
  }).populate('device');
  res.status(200).json({
    data,
  });
};

export const getSummaryByMonthAndDevice = async (
  req: Request,
  res: TypedResponse<GomezAggregateByMonthAndDevice>
) => {
  const data = await Measure.aggregateConsumptionByMonthAndDevice();

  res.status(200).json({
    data,
  });
};

export const getSummaryByMonth = async (
  req: Request,
  res: TypedResponse<GomezAggregateByMonth>
) => {
  const data = await Measure.aggregateConsumptionByMonth();
  res.status(200).json({
    data,
  });
};

export const getSummaryByDay = async (
  req: Request,
  res: TypedResponse<GomezAggregateByDay>
) => {
  const data = await Measure.aggregateConsumptionByDay();
  res.status(200).json({
    data,
  });
};

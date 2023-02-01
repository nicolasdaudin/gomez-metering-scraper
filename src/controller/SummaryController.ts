import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Measure from '../model/Measure';
import { EmailNotifier } from '../service/notifications/EmailNotifier';
import { DailyEmailReport } from '../service/report/DailyEmailReport';

export const getYesterdaySummaryByDevice = async (
  req: Request,
  // TODO: the following TypedResponse does not work since IMeasure has deviceSerialNumber and Measure.find does not....
  // res: TypedResponse<{ data: IMeasure[] }>
  res: Response
) => {
  const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
  const data = await Measure.aggregateConsumptionByDayAndDevice(yesterday);

  // calculate total cost and total consumption for the day
  const totals = data.reduce(
    (prev, curr) => ({
      cost: prev.cost + +curr.costForTheDay,
      consumption: prev.consumption + +curr.consumption,
    }),
    { cost: 0, consumption: 0 }
  );

  res.render('summary', {
    title: `Résumé du ${yesterday.setLocale('fr').toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    type: 'by-day-and-device',
    data,
    totals,
  });
};

export const sendYesterdaySummaryByDevice = async (
  req: Request,
  res: Response
) => {
  // get consolidated info for extracted measures
  const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');

  const yesterdayData = await Measure.aggregateConsumptionByDayAndDevice(
    yesterday
  );

  const byMonth = await Measure.aggregateConsumptionByMonth();

  const notifier = new EmailNotifier(
    new DailyEmailReport(yesterdayData, byMonth, yesterday)
  );
  await notifier.notify('nicolas.daudin@gmail.com', yesterday);

  res.status(200).json({
    message: 'Succesfully sent data by email for yesterday',
    data: yesterdayData,
  });
};

export const getSummaryByMonthAndDevice = async (
  req: Request,
  // res: TypedResponse<GomezAggregateByMonthAndDevice>
  res: Response
) => {
  const data = await Measure.aggregateConsumptionByMonthAndDevice();
  res.render('summary', {
    title: 'Résumé par mois et appareil',
    type: 'by-month-and-device',
    data,
  });
  // res.status(200).json({
  //   data,
  // });
};

export const getSummaryByMonth = async (
  req: Request,
  // res: TypedResponse<GomezAggregateByMonth>
  res: Response
) => {
  const data = await Measure.aggregateConsumptionByMonth();
  res.render('summary', { title: 'Résumé par mois', type: 'by-month', data });
  // res.status(200).json({
  //   data,
  // });
};

export const getSummaryByDay = async (
  req: Request,
  // res: TypedResponse<GomezAggregateByDay>
  res: Response
) => {
  const data = await Measure.aggregateConsumptionByDay();
  res.render('summary', { title: 'Résumé par jour', type: 'by-day', data });
  // res.status(200).json({
  //   data,
  // });
};

export const getSummaryByInvoice = async (req: Request, res: Response) => {
  const data = await Measure.aggregateConsumptionByGomezInvoice();
  res.render('summary', {
    title: 'Résumé par intervalle de dates',
    type: 'by-invoice',
    data,
  });
};

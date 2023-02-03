import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Measure from '../model/Measure';
import { GomezExtractor } from '../service/extractor/GomezExtractor';
import { MeasureStore } from '../service/measure/MeasureStore';
import { EmailNotifier } from '../service/notifications/EmailNotifier';
import { DailyEmailReport } from '../service/report/DailyEmailReport';
import { TypedRequestParam } from '../types/GomezRequest';

export const extractYesterdayMeasures = async (req: Request, res: Response) => {
  console.log('Reading from Gomez....');
  if (
    !process.env.GOMEZ_USER ||
    !process.env.GOMEZ_PASSWORD ||
    !process.env.REPORT_EMAIL_TO
  ) {
    res.status(500).json({
      data: [],
      message:
        'Either email for reports or Gomez Metering credentials are missing from environment variables, please check environment variables, especially GOMEZ_USER, GOMEZ_PASSWORD and REPORT_EMAIL_TO',
    });
    return;
  }

  const measures = await GomezExtractor.extract(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  await MeasureStore.save(measures);

  // get consolidated info for extracted measures
  const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');

  const yesterdayMeasures = await Measure.aggregateConsumptionByDayAndDevice(
    yesterday
  );

  const byMonthAggregate = await Measure.aggregateConsumptionByMonth();

  const sinceLastInvoiceAggregate = (
    await Measure.aggregateConsumptionSinceLastInvoice()
  )[0];

  const notifier = new EmailNotifier(
    new DailyEmailReport(
      yesterdayMeasures,
      byMonthAggregate,
      sinceLastInvoiceAggregate,
      yesterday
    )
  );
  await notifier.notify(process.env.REPORT_EMAIL_TO, yesterday);

  res.status(200).json({
    message: 'Succesfully extracted data for yesterday',
    data: yesterdayMeasures,
  });
};

export const updateSpecificDateMeasures = async (
  req: Request,
  res: Response
) => {
  console.log('Reading from Gomez....');
  if (
    !process.env.GOMEZ_USER ||
    !process.env.GOMEZ_PASSWORD ||
    !process.env.REPORT_EMAIL_TO
  ) {
    res.status(500).json({
      data: [],
      message:
        'Either email for reports or Gomez Metering credentials are missing from environment variables, please check environment variables, especially GOMEZ_USER, GOMEZ_PASSWORD and REPORT_EMAIL_TO',
    });
    return;
  }

  const measures = await GomezExtractor.extract(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD,
    7
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  // get consolidated info for extracted measures
  const date = DateTime.fromISO(req.params.date).startOf('day');
  const measuresForThatDay = measures.filter((measure) =>
    measure.measureDate.startOf('day').equals(date)
  );
  console.log(
    `we will update ${measuresForThatDay.length} measures for date ${date}`
  );

  await MeasureStore.update(measuresForThatDay);

  const dayMeasures = await Measure.aggregateConsumptionByDayAndDevice(date);

  const byMonthAggregate = await Measure.aggregateConsumptionByMonth();

  const sinceLastInvoiceAggregate = (
    await Measure.aggregateConsumptionSinceLastInvoice()
  )[0];

  const notifier = new EmailNotifier(
    new DailyEmailReport(
      dayMeasures,
      byMonthAggregate,
      sinceLastInvoiceAggregate,
      date
    )
  );
  await notifier.notify(process.env.REPORT_EMAIL_TO, date);

  res.status(200).json({
    message: `Succesfully extracted and updated data for day ${date}`,
    data: dayMeasures,
  });
};

export const extractHistoricalMeasures = async (
  req: TypedRequestParam<{ nbOfDaysToExtract: string }>,
  res: Response
) => {
  console.log('Reading from Gomez....');

  if (!process.env.GOMEZ_USER || !process.env.GOMEZ_PASSWORD) {
    res.status(500).json({
      data: [],
      message:
        'Gomez Metering credentials missing from environment variables, please init GOMEZ_USER and GOMEZ_PASSWORD',
    });
    return;
  }

  const measures = await GomezExtractor.extract(
    process.env.GOMEZ_USER,
    process.env.GOMEZ_PASSWORD,
    +req.params.nbOfDaysToExtract
  );
  console.log('nb of measures we got from fetchGomez', measures.length);

  await MeasureStore.save(measures);

  res.status(200).json({
    message: `Succesfully extracted historic data from Gomez. Don't forget to clean out of range values at /summary/clean`,
    data: measures,
  });
};

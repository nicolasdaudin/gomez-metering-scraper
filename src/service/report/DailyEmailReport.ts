import { DateTime } from 'luxon';
import {
  AggregateByDayAndDevice,
  AggregateByMonth,
  calculateByDayAndDevice,
} from '../../model/MeasureAggregate';
import { IReport } from './IReport';
import pug from 'pug';

export class DailyEmailReport implements IReport<AggregateByDayAndDevice> {
  constructor(
    public data: AggregateByDayAndDevice[],
    public byMonth: AggregateByMonth[],
    public day: DateTime
  ) {}

  build(): string {
    // calculate total cost and total consumption for the day
    const totals = calculateByDayAndDevice(this.data);

    const html = pug.renderFile('./src/views/email.pug', {
      data: this.data.sort((a, b) => b.costForTheDay - a.costForTheDay),
      byMonth: this.byMonth.slice(0, 6).map((item) => ({
        ...item,
        month: DateTime.fromFormat(item.month, `yyyy'-'MM`, {
          locale: 'fr',
        }).toLocaleString({ month: 'long', year: 'numeric' }),
      })),
      totals,
      day: this.day,
    });

    return html;
  }
}

import { DateTime } from 'luxon';
import {
  AggregateByDayAndDevice,
  calculateByDayAndDevice,
} from '../../model/MeasureAggregate';
import { IReport } from './IReport';
import pug from 'pug';

export class DailyEmailReport implements IReport<AggregateByDayAndDevice> {
  constructor(public data: AggregateByDayAndDevice[], public day: DateTime) {}

  build(): string {
    // calculate total cost and total consumption for the day
    const totals = calculateByDayAndDevice(this.data);

    const html = pug.renderFile('./src/views/email.pug', {
      data: this.data.sort((a, b) => b.costForTheDay - a.costForTheDay),
      totals,
      day: this.day,
    });

    return html;
  }
}

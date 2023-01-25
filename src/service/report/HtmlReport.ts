import { DateTime } from 'luxon';
import { IMeasure } from '../measure/IMeasure';
import { IReport } from './IReport';

export class HtmlReport implements IReport<IMeasure> {
  constructor(
    public data: IMeasure[],
    public locations: { id: number; name: string }[]
  ) {}

  build(): string {
    const measureReport = this.data
      .map((measure) => {
        // console.log(
        //   'Building report for measure',
        //   measure.deviceSerialNumber,
        //   measure.consumption
        // );
        const location = this.locations.find(
          (location) => location.id === measure.deviceSerialNumber
        );

        return `<li>${location?.name} : ${measure.consumption}</li>`;
      })
      .join('\n');

    const totalConsumption = this.data.reduce(
      (prev, curr) => (curr?.consumption || 0) + prev,
      0
    );

    const date = this.data[0].measureDate
      .setLocale('es')
      .toLocaleString(DateTime.DATE_FULL);

    return `
<div>
  <p>Tu consumo para el día ${date} ha sido de :</p>
  <ul>
${measureReport}
  </ul>
  <p>Tu consumo total ha sido de ${totalConsumption}</p>
</div>`;
  }
}

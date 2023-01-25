import { DateTime } from 'luxon';
import { IMeasure } from '../measure/IMeasure';
import { IReport } from './IReport';

/*

30796099 : Baño pequeño
30796098 : Baño grande
30254638 : Habitación Nico
30254661 : Habitación Amelia
30254635 : Habitación Jime
30254633 : Salón 

*/

export class TextReport implements IReport<IMeasure> {
  constructor(
    public data: IMeasure[],
    public locations: { id: number; name: string }[]
  ) {}

  build(): string {
    console.log('nb of measures', this.data.length);
    const measureReport = this.data
      .map((measure) => {
        console.log(
          'Building report for measure',
          measure.deviceSerialNumber,
          measure.consumption
        );
        const location = this.locations.find(
          (location) => location.id === measure.deviceSerialNumber
        );

        return `${location?.name} : ${measure.consumption}`;
      })
      .join('\n');

    const totalConsumption = this.data.reduce(
      (prev, curr) => (curr?.consumption || 0) + prev,
      0
    );

    const date = this.data[0].measureDate
      .setLocale('es')
      .toLocaleString(DateTime.DATE_FULL);

    return `Tu consumo para el día ${date} ha sido de : 
\n${measureReport}
\nTu consumo total ha sido de ${totalConsumption}`;
  }
}

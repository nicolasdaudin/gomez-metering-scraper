import { DateTime } from 'luxon';
import { Measure } from '../reader/Measure';

/*

30796099 : Baño pequeño
30796098 : Baño grande
30254638 : Habitación Nico
30254661 : Habitación Amelia
30254635 : Habitación Jime
30254633 : Salón 

*/

export class Report {
  static build(
    data: Measure[],
    locations: {
      id: number;
      name: string;
    }[]
  ): string {
    console.log('nb of measures', data.length);
    const measureReport = data
      .map((measure) => {
        console.log(
          'Building report for measure',
          measure.deviceSerialNumber,
          measure.consumption
        );
        const location = locations.find(
          (location) => location.id === measure.deviceSerialNumber
        );

        return `${location?.name} : ${measure.consumption}`;
      })
      .join('\n');

    const totalConsumption = data.reduce(
      (prev, curr) => (curr?.consumption || 0) + prev,
      0
    );

    const date = data[0].measureDate
      .setLocale('es')
      .toLocaleString(DateTime.DATE_FULL);

    const env =
      process.env.NODE_ENV === 'production' ? 'production' : 'development';

    return `(${env}) Tu consumo para el día ${date} ha sido de : 
\n${measureReport}
\nTu consumo total ha sido de ${totalConsumption}`;
  }
}

import { Measure } from '../reader/Measure';

/*

30796099 : Baño pequeño
30796098 : Baño grande
30254638 : Habitación Nico
30254661 : Habitación Amelia
30254635 : Habitación Jime
30254633 : Salón 

*/

const locationsFromId = [
  { id: 30796099, name: 'Baño pequeño' },
  {
    id: 30796098,
    name: 'Baño grande',
  },
  {
    id: 30254638,
    name: 'Habitación Nico',
  },
  {
    id: 30254661,
    name: 'Habitación Amelia',
  },
  {
    id: 30254635,
    name: 'Habitación Jime',
  },
  {
    id: 30254633,
    name: 'Salón',
  },
  { id: 30254659, name: 'Dormitorio principal' },
];

export class Report {
  static build(data: Measure[]): string {
    console.log('nb of measures', data.length);
    const measureReport = data
      .map((measure) => {
        console.log(
          'Building report for measure',
          measure.deviceSerialNumber,
          measure.consumption
        );
        const location = locationsFromId.find(
          (location) => location.id === measure.deviceSerialNumber
        );

        return `${location?.name} : ${measure.consumption}`;
      })
      .join('\n');

    const totalConsumption = data.reduce(
      (prev, curr) => (curr?.consumption || 0) + prev,
      0
    );

    return `Tu consumo ayer ha sido de:
    \n${measureReport}    
    \nTu consumo total ha sido de ${totalConsumption}`;
  }
}

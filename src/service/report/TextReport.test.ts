import { DateTime } from 'luxon';
import { GomezMeasure } from '../measure/GomezMeasure';
import { TextReport } from './TextReport';

describe('Report builder - Unit tests', () => {
  const locations: { id: number; name: string }[] = [
    { id: 1, name: 'Room 1' },
    { id: 2, name: 'Room 2' },
  ];

  test('Correctly sums up the measures', () => {
    const measures = new Array<GomezMeasure>();
    measures.push(
      new GomezMeasure(1, DateTime.fromISO('2016-05-25T09:08:34.123'), 423, 4)
    );
    measures.push(
      new GomezMeasure(2, DateTime.fromISO('2016-05-25T09:08:34.123'), 232, 7)
    );

    const expectedString = `Tu consumo para el día 25 de mayo de 2016 ha sido de : 

Room 1 : 4
Room 2 : 7

Tu consumo total ha sido de 11`;

    const report = new TextReport(measures, locations).build();

    expect(report).toEqual(expectedString);
  });
});

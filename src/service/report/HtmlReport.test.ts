import { DateTime } from 'luxon';
import { GomezMeasure } from '../measure/GomezMeasure';
import { HtmlReport } from './HtmlReport';

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

    const expectedString = `
<div>
  <p>Tu consumo para el día 25 de mayo de 2016 ha sido de :</p>
  <ul>
<li>Room 1 : 4</li>
<li>Room 2 : 7</li>
  </ul>
  <p>Tu consumo total ha sido de 11</p>
</div>`;

    const report = new HtmlReport(measures, locations).build();

    expect(report).toEqual(expectedString);
  });
});

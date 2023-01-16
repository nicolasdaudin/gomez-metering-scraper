import { GomezReader } from './GomezReader';
import { Measure } from './Measure';
import { DateTime, Interval } from 'luxon';

describe.skip('Gomez Reader - Integration tests', () => {
  jest.setTimeout(10000);

  describe('Test setup', () => {
    test('user and password credentials are known', () => {
      expect(process.env.GOMEZ_USER).not.toBeUndefined();
      expect(process.env.GOMEZ_PASSWORD).not.toBeUndefined();
    });
  });

  describe('Login', () => {
    let reader: GomezReader | undefined = undefined;
    afterEach(() => {
      if (reader) reader.closeBrowser();
    });
    test('scraper logs in correctly to remote page', async () => {
      reader = new GomezReader(
        process.env.GOMEZ_USER as string,
        process.env.GOMEZ_PASSWORD as string
      );
      expect.assertions(1);
      await reader.login();
      expect(reader.getBrowserPage()).not.toBeUndefined();
    });
    test('scraper throws error if something goes wrong', async () => {
      const FAKE_NAME = 'fakenamexyz';
      const FAKE_PASSWORD = 'fakepasswordxyz';
      reader = new GomezReader(FAKE_NAME, FAKE_PASSWORD);
      expect.assertions(1);
      try {
        await reader.login();
      } catch (err) {
        expect(err).toMatchObject({
          message: expect.stringContaining(FAKE_NAME),
        });
      }
    });

    // if credentials were incorrect, an error modal will show so in login() we can have a specific error
    test.todo('scraper throws specific error if credentials were incorrect');
  });

  describe('Reading measures', () => {
    let reader: GomezReader | undefined = undefined;
    afterEach(() => {
      if (reader) reader.closeBrowser();
    });
    test('Reads correctly data from today or yesterday', async () => {
      reader = new GomezReader(
        process.env.GOMEZ_USER as string,
        process.env.GOMEZ_PASSWORD as string
      );

      const today = DateTime.now();
      const measures: (Measure | null)[] = await reader.read();

      expect(measures.length).toBeGreaterThan(0);
      expect(measures.every((measure) => measure != null)).toBe(true);

      // hard-coded check of the last 7 readings since I know that on my own Gomez setup I have 7 heaters. I should relate this test to my heaters in database and check the readings according to that list of heaters
      const lastMeasures = measures.slice(0, 6);

      const checkMeasureDateIsTodayOrYesterday = (
        measureDate: DateTime
      ): boolean => {
        const interval = Interval.fromDateTimes(measureDate, today);
        console.log(measureDate.toString(), today.toString());
        return interval.count('days') <= 2;
      };

      expect(
        lastMeasures.every(
          (measure) =>
            measure && checkMeasureDateIsTodayOrYesterday(measure.measureDate)
        )
      ).toBe(true);
    });
  });
});

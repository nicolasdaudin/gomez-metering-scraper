import { PlaywrightGomezReader } from './PlaywrightGomezReader';
import { IMeasure } from '../measure/IMeasure';
import { DateTime, Interval } from 'luxon';

describe('Playwright Gomez Reader - Integration tests', () => {
  jest.setTimeout(10000);

  describe('Test setup', () => {
    test('user and password credentials are known', () => {
      expect(process.env.GOMEZ_USER).not.toBeUndefined();
      expect(process.env.GOMEZ_PASSWORD).not.toBeUndefined();
    });
  });

  describe('Login', () => {
    let reader: PlaywrightGomezReader | undefined = undefined;
    afterEach(async () => {
      if (reader) await reader.closeBrowserAndContext();
    });
    test('scraper logs in correctly to remote page', async () => {
      reader = new PlaywrightGomezReader(
        process.env.GOMEZ_USER as string,
        process.env.GOMEZ_PASSWORD as string
      );
      await reader.login();
      expect(reader.getBrowserPage()).not.toBeUndefined();
    });
    test('scraper throws error if something goes wrong', async () => {
      const FAKE_NAME = 'fakenamexyz';
      const FAKE_PASSWORD = 'fakepasswordxyz';
      reader = new PlaywrightGomezReader(FAKE_NAME, FAKE_PASSWORD);
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
    let reader: PlaywrightGomezReader | undefined = undefined;
    afterEach(async () => {
      if (reader) await reader.closeBrowserAndContext();
    });
    test('Reads correctly data from today or yesterday', async () => {
      reader = new PlaywrightGomezReader(
        process.env.GOMEZ_USER as string,
        process.env.GOMEZ_PASSWORD as string
      );

      const today = DateTime.now();
      const measures: (IMeasure | null)[] = await reader.read(1);

      expect(measures.length).toBeGreaterThan(0);
      expect(measures.every((measure) => measure != null)).toBe(true);

      // hard-coded check of the last 7 readings since I know that on my own Gomez setup I have 7 heaters. I should relate this test to my heaters in database and check the readings according to that list of heaters
      const lastMeasures = measures.slice(0, 6);

      const checkMeasureDateIsTodayOrYesterday = (
        measureDate: DateTime
      ): boolean => {
        const interval = Interval.fromDateTimes(measureDate, today);
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

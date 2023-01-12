import { GomezReader } from './GomezReader';

describe('Gomez Reader', () => {
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
});

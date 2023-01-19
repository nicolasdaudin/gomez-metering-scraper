/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser, BrowserContext, firefox, Page } from 'playwright';
import { GomezMeasure } from './GomezMeasure';
import { Measure } from './Measure';
import { Reader } from './Reader';

export class PlaywrightGomezReader implements Reader<GomezMeasure> {
  private _page: Page | undefined;
  private _browser: Browser | undefined;
  private _context: BrowserContext | undefined;

  constructor(private user: string, private password: string) {}

  getBrowserPage(): Page | undefined {
    return this._page;
  }

  async closeBrowserAndContext() {
    await this._browser?.close();
    await this._context?.close();
  }

  async login() {
    try {
      this._browser = await firefox.launch({
        headless: true,
        // args: ['--no-sandbox'],
      });
      const context = await this._browser.newContext();
      const page = await context.newPage();
      await page.setViewportSize({ width: 1366, height: 768 });

      await page.goto('https://ov.gomezgroupmetering.com/preLogin');

      // await page.getByPlaceholder('Email o Usuario').click();
      await page.getByPlaceholder('Email o Usuario').fill(this.user);

      // await page.getByPlaceholder('Contraseña').click();

      await page.getByPlaceholder('Contraseña').fill(this.password);

      await page.getByRole('button', { name: 'Acceder' }).click();

      await page
        .getByRole('link', { name: /lecturas diarias/i })
        .waitFor({ timeout: 3000 });

      this._context = context;
      this._page = page;
    } catch (err: any) {
      await this.closeBrowserAndContext();
      throw new Error(
        `Could not log with these credentials user=${this.user} password=${this.password}, failed with error: ${err.message}`
      );
    }
  }

  async read(): Promise<GomezMeasure[]> {
    if (!this._page) {
      console.log('first, we log in');
      await this.login();
      console.log('success, logged in');
    }

    if (!this._page) {
      await this.closeBrowserAndContext();
      return [];
    }

    await this._page.goto(
      'https://ov.gomezgroupmetering.com/lecturasAbonadoDiario'
    );

    // select option 50 measures
    // otherwise, measure rows won't be displayed in the page to scrape
    await this._page
      .getByRole('combobox', { name: 'Mostrar registros' })
      .selectOption('50');

    const rowsLocator = await this._page
      .locator('#tableLecturas > tbody')
      .getByRole('row');

    // actual scrape: for each row, we get the values in the cells we need
    const measuresAsStrings = await rowsLocator.evaluateAll(
      (htmlRows: HTMLElement[]) =>
        htmlRows.map((row) => {
          const deviceSerialNumber = row
            .querySelector('td:nth-child(3)')
            ?.textContent?.trim();
          const measureDate = row
            .querySelector('td:nth-child(4)')
            ?.textContent?.trim();
          const measure = row
            .querySelector('td:nth-child(6)')
            ?.textContent?.trim();
          const consumption = row
            .querySelector('td:nth-child(7)')
            ?.textContent?.trim();

          // we can't create a GomezMeasure object here, since we are in the context of the page we are scraping
          return { deviceSerialNumber, measureDate, measure, consumption };
        })
    );
    const measures = measuresAsStrings.map(
      ({ deviceSerialNumber, measureDate, measure, consumption }) => {
        if (!deviceSerialNumber || !measureDate || !measure || !consumption)
          return null;
        return GomezMeasure.fromString({
          deviceSerialNumber,
          measureDate,
          measure,
          consumption,
        });
      }
    ) as Measure[];

    // for some reasons, evaluateAll above inverts the order of the rows
    // in the web page the rows are sorted by descending date, but the array we get has
    // the rows sorted by ascending date.
    const sortedMeasures = measures.sort((a, b) =>
      a.measureDate > b.measureDate ? -1 : 1
    );

    await this.closeBrowserAndContext();
    return sortedMeasures;
  }
}

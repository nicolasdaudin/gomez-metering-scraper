/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer, { Browser, Page } from 'puppeteer';
import { GomezMeasure } from './GomezMeasure';
import { Measure } from './Measure';
import { Reader } from './Reader';

export class GomezReader implements Reader<GomezMeasure> {
  private _page: Page | undefined = undefined;
  private _browser: Browser | undefined = undefined;

  constructor(private user: string, private password: string) {}

  getBrowserPage(): Page | undefined {
    return this._page;
  }

  closeBrowser() {
    this._browser?.close();
  }

  async login() {
    try {
      this._browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
      });
      const page = await this._browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto('https://ov.gomezgroupmetering.com/preLogin');
      await page.screenshot({ path: './screenshots/login.png' });

      await page.type('.form-control[name=user]', this.user);
      await page.type('.form-control[name=password]', this.password);

      console.log('trying to log in');
      await page.$eval(
        'body > div.container > div.allblock > div.line-sep > form > button',
        (el) => el.click()
      );

      await page.waitForSelector('#lecturasDiariaOption', { timeout: 3000 });

      this._page = page;
    } catch (err: any) {
      this._browser?.close();
      throw new Error(
        `Could not log with these credentials user=${this.user} password=${this.password}, failed with error: ${err.message}`
      );
    }
  }

  async read(): Promise<GomezMeasure[]> {
    if (!this._page) {
      console.log('first, we log in');
      await this.login();
    }
    // console.log('lecturasDiarias visible');
    if (!this._page) {
      this._browser?.close();
      return [];
    }

    await this._page.goto(
      'https://ov.gomezgroupmetering.com/lecturasAbonadoDiario'
    );

    await this._page.screenshot({ path: './screenshots/consumo.png' });

    const measuresTableFirstMeasureSelector =
      '#tableLecturas > tbody > tr:nth-child(1) > td:nth-child(6)';
    await this._page.waitForSelector(measuresTableFirstMeasureSelector);

    const measureRows = await this._page.$$('#tableLecturas > tbody > tr');
    const measuresForReal: Measure[] = (await Promise.all(
      measureRows.map(async (element) => {
        if (!this._page) return null;

        // device serial number is in index 2 of the row, measure date in 3, measure in 5, consumption in 6
        return GomezMeasure.fromString({
          deviceSerialNumber: await this._page.evaluate(
            (element) => element.cells[2].innerText,
            element
          ),
          measureDate: await this._page.evaluate(
            (element) => element.cells[3].innerText,
            element
          ),
          measure: await this._page.evaluate(
            (element) => element.cells[5].innerText,
            element
          ),
          consumption: await this._page.evaluate(
            (element) => element.cells[6].innerText,
            element
          ),
        });
      })
    )) as Measure[];

    // console.log(measuresForReal);
    this._browser?.close();
    return measuresForReal;
  }
}

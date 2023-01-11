import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';

const app = express();

interface Measure {
  deviceSerialNumber: number;
  measureDate: Date;
  measure: number;
  consumption: number;
}

class GomezMeasure implements Measure {
  static fromString({
    deviceSerialNumber,
    measureDate,
    measure,
    consumption,
  }: {
    deviceSerialNumber: string;
    measureDate: string;
    measure: string;
    consumption: string;
  }): Measure {
    return new GomezMeasure(
      +deviceSerialNumber,
      new Date(measureDate),
      parseFloat(measure),
      parseFloat(consumption)
    );
  }

  constructor(
    public deviceSerialNumber: number,
    public measureDate: Date,
    public measure: number,
    public consumption: number
  ) {}
}

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello Gomgez Metering Scraper');
});

app.listen(3000, () => {
  console.log('listening on port 3000');
  console.log('###');
  console.log('### Welcome to app Gomez Metering Scraper');
  console.log('###');
});

app.get('/fetchGomez', async (req: Request, res: Response): Promise<void> => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('https://ov.gomezgroupmetering.com/preLogin');
  await page.screenshot({ path: './screenshots/login.png' });

  await page.type('.form-control[name=user]', 'nicolas.daudin@gmail.com');
  await page.type('.form-control[name=password]', 'u7MePLLRfj36B');

  console.log('trying to log in');
  await page.$eval(
    'body > div.container > div.allblock > div.line-sep > form > button',
    (el) => el.click()
  );

  await page.waitForSelector('#lecturasDiariaOption', { timeout: 10000 });
  console.log('lecturasDiarias visible');
  await page.goto('https://ov.gomezgroupmetering.com/lecturasAbonadoDiario');

  await page.screenshot({ path: './screenshots/consumo.png' });

  const measuresTableFirstMeasureSelector =
    '#tableLecturas > tbody > tr:nth-child(1) > td:nth-child(6)';
  await page.waitForSelector(measuresTableFirstMeasureSelector);

  const measureRows = await page.$$('#tableLecturas > tbody > tr');
  const measuresForReal = await Promise.all(
    measureRows.map(async (element) => {
      // device serial number is in index 2 of the row
      // measure date in 3
      // measure in 5
      // consumption in 6
      return GomezMeasure.fromString({
        deviceSerialNumber: await page.evaluate(
          (element) => element.cells[2].innerText,
          element
        ),
        measureDate: await page.evaluate(
          (element) => element.cells[3].innerText,
          element
        ),
        measure: await page.evaluate(
          (element) => element.cells[5].innerText,
          element
        ),
        consumption: await page.evaluate(
          (element) => element.cells[6].innerText,
          element
        ),
      });
    })
  );
  console.log(measuresForReal);

  res.send('fetching...');
});

// see https://stackoverflow.com/questions/45093510/eslint-not-working-in-vs-code
// see https://stackoverflow.com/questions/56988147/eslint-doesnt-work-in-vscode-but-work-from-terminal

// AND THEN, README.MD + GIT

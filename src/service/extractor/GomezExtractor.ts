import { PlaywrightGomezReader } from '../reader/PlaywrightGomezReader';

export class GomezExtractor {
  static async extract(user: string, password: string, nbOfDaysToExtract = 1) {
    const reader = new PlaywrightGomezReader(user, password);
    const measures = await reader.read(nbOfDaysToExtract);

    return measures;
  }
}

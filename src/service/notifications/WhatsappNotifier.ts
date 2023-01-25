import { DateTime } from 'luxon';
import { Twilio } from 'twilio';
import { IMeasure } from '../measure/IMeasure';
import { IReport } from '../report/IReport';
import { Notifier } from './Notifier';

export class WhatsappNotifier implements Notifier<IReport<IMeasure>> {
  constructor(public report: IReport<IMeasure>) {}
  async notify(to: string, date: DateTime): Promise<void> {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error(
        'Twilio credentials credentials missing from environment variables, please init TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
      );
      return;
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = new Twilio(accountSid, authToken);

    const content = this.report.build();

    const env =
      process.env.NODE_ENV === 'production' ? 'production' : 'development';

    const message = await client.messages.create({
      body: `(${env}) ${content}`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
    });
    console.log('Whatsapp message status? ', message.status);
  }
}

import { Twilio } from 'twilio';
import { LOCATIONS_FROM_ID } from '../dataset/heaterLocations';
import { Measure } from '../reader/Measure';
import { Report } from '../report/Report';

export class WhatsappNotifier {
  async notify(to: string, data: Measure[]): Promise<void> {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error(
        'Twilio credentials credentials missing from environment variables, please init TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
      );
      return;
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = new Twilio(accountSid, authToken);

    const content = Report.build(data.slice(0, 7), LOCATIONS_FROM_ID);

    const message = await client.messages.create({
      body: content,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
    });
    console.log('Whatsapp message status? ', message.status);
  }
}

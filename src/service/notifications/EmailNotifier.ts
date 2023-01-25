import { IMeasure } from '../measure/IMeasure';
import { Notifier } from './Notifier';
import nodemailer from 'nodemailer';
import { TextReport } from '../report/TextReport';
import { LOCATIONS_FROM_ID } from '../../dataset/heaterLocations';
import { DateTime } from 'luxon';

export class EmailNotifier implements Notifier<IMeasure> {
  async notify(to: string, data: IMeasure[]): Promise<void> {
    const transporter = nodemailer.createTransport({
      // service: 'gmail',
      // auth: {
      //   user: 'nicolas.ddn.fr@gmail.com',
      //   pass: process.env.GMAIL_NODEMAILER_PWD,
      // },
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'nicolas.ddn.fr@gmail.com',
        pass: process.env.GMAIL_NODEMAILER_PWD,
      },
    });

    const date = data[0].measureDate
      .setLocale('es')
      .toLocaleString(DateTime.DATE_FULL);
    const subject = `Tu consumo para el día ${date}`;

    const mailHtml = new TextReport(
      data.slice(0, 7),
      LOCATIONS_FROM_ID
    ).build();

    const mailOptions = {
      from: '"Gomez Metering Scraper" <no-reply@gomez-metering-scraper.herokuapp.com>', // sender address
      to,
      subject,
      html: mailHtml, // html body
    };

    // send mail with defined transport object
    try {
      await transporter.sendMail(mailOptions);
      console.log('Mail successfully sent');
    } catch (err) {
      console.error('Email could not be sent because of error:', err);
    }
  }
}

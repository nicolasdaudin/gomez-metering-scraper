import { INotifier } from './INotifier';
import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';
import { IReport } from '../report/IReport';
import { AggregateByDayAndDevice } from '../../model/MeasureAggregate';

export class EmailNotifier
  implements INotifier<IReport<AggregateByDayAndDevice>>
{
  constructor(public report: IReport<AggregateByDayAndDevice>) {}
  async notify(to: string, date: DateTime): Promise<void> {
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

    const subjectDate = date.setLocale('fr').toLocaleString(DateTime.DATE_FULL);
    const subject = `Ta consommation pour le ${subjectDate}`;

    const mailHtml = this.report.build();
    const env = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';

    const mailOptions = {
      from: `"Gomez Metering Scraper (${env})" <no-reply@gomez-metering-scraper.herokuapp.com>`, // sender address
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

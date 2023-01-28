import express, { Request, Response } from 'express';
import { DateTime } from 'luxon';
import EnergyCost from '../model/EnergyCost';

export const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const data = await EnergyCost.find({});
  res.status(200).json({
    message: 'Succesfully retrieved all energy costs',
    data,
  });
});

router.post('/', async (req: Request, res: Response) => {
  const { beginDate, endDate, cost } = req.body;

  const beginDateEC = DateTime.fromFormat(beginDate, `dd'/'MM'/'yyyy`);

  const endDateEC = DateTime.fromFormat(endDate, `dd'/'MM'/'yyyy`);

  console.log(beginDateEC.toISO());
  console.log(endDateEC.toISO());
  try {
    const data = await EnergyCost.create({
      beginDate: beginDateEC,
      endDate: endDateEC,
      cost,
    });
    res.status(200).json({
      message: 'Succesfully added a new energy cost',
      data,
    });
  } catch (err) {
    console.error(`Error while inserting new Energy Cost `, err);
    res.status(500).json({
      message: 'Problem while adding energy cost, please check logs',
    });
  }
});

import { DateTime } from 'luxon';
import { model, Model, Schema } from 'mongoose';

interface IEnergyCost {
  beginDate: DateTime;
  endDate: DateTime;
  cost: number;
}

interface EnergyCostModel extends Model<IEnergyCost> {
  findCostByDate(date: DateTime): number;
}

const energyCostSchema = new Schema<IEnergyCost, EnergyCostModel>({
  beginDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cost: { type: Number, required: true },
});

energyCostSchema.index({ beginDate: 1, endDate: 1 }, { unique: true });

energyCostSchema.static(
  'findCostByDate',
  async function findCostByDate(date: DateTime) {
    const energyCost = await EnergyCost.findOne({
      beginDate: { $lte: date },
      endDate: { $gte: date },
    });
    if (!energyCost) throw Error(`Please define energy cost for date ${date}`);

    return energyCost.cost;
  }
);

const EnergyCost = model<IEnergyCost, EnergyCostModel>(
  'EnergyCost',
  energyCostSchema
);
export default EnergyCost;

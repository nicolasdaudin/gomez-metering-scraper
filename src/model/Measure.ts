import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MeasureSchema = new Schema({
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  measureDate: { type: Date, required: true },
  measure: { type: Number, required: true },
  consumption: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const Measure = mongoose.model('Measure', MeasureSchema);
export default Measure;
// - une collection measures pour les lectures du dispositif
// 	- id_gomez_device : 39798902 (extrrait de gomez)
// 	- date: 2023-01-08 (extrait de Gomez)
// 	- last_updated : 2023-01-09 (date de dernière lecture par le crawler)
// 	- measure: 3242 (extrait de Gomez)
// 	- consumption: 8 (extrait de Gomez)
// 	(after) - unit_cost : (utiliser un par défaut au début, puis ensuite utiliser celui de la collection 'devices', ... )
// 	(adter) - cost : (calculé via unit_cost)

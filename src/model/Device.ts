import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
  serialNumber: { type: Number, required: true },
  location: { type: String, required: true },
});

const Device = mongoose.model('Device', DeviceSchema);
export default Device;

import { Model, Schema, model } from 'mongoose';

interface IDevice {
  serialNumber: number;
  location: string;
  coefficient: number;
}

interface DeviceModel extends Model<IDevice> {
  findBySerialNumber(serialNumber: number): IDevice;
}

const deviceSchema = new Schema<IDevice, DeviceModel>({
  serialNumber: { type: Number, required: true, unique: true },
  location: { type: String, required: true },
  coefficient: { type: Number, required: true },
});
deviceSchema.static(
  'findBySerialNumber',
  async function findBySerialNumber(serialNumber: number) {
    return await this.findOne({ serialNumber });
  }
);

const Device = model<IDevice, DeviceModel>('Device', deviceSchema);
export default Device;

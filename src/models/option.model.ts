import mongoose from 'mongoose';
import moment from 'jalali-moment';

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: String, unique: true, required: true },
    createdAt: { type: Number, required: true, default: moment(new Date()).format('X') },
    updatedAt: Number,
    deletedAt: Number,
    softDelete: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    versionKey: false,
  }
);

const Option = mongoose.model('Option', optionSchema);
export default Option;

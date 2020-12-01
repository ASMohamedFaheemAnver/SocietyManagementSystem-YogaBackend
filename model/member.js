const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const memberSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  arrears: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  society: { type: Schema.Types.ObjectId, ref: "Society" },
  fines: [{ type: Schema.Types.ObjectId, ref: "Fine" }],
  extra_fees: [{ type: Schema.Types.ObjectId, ref: "ExtraFee" }],
  month_fees: [{ type: Schema.Types.ObjectId, ref: "MonthFee" }],
  logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
});

module.exports = mongoose.model("Member", memberSchema);

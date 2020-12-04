const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const societySchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  regNo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  number_of_members: {
    type: Number,
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
  phoneNumber: {
    type: String,
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
  expected_income: {
    type: Number,
    default: 0,
  },
  current_income: {
    type: Number,
    default: 0,
  },

  month_fee: {
    type: { description: String, amount: Number },
    default: { description: "Monthly fees.", amount: 100 },
  },
  members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
  logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
});

module.exports = mongoose.model("Society", societySchema);

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
  donations: {
    type: Number,
    default: 0,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
    required: true,
  },
  is_removed: {
    type: Boolean,
    default: false,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  society: { type: Schema.Types.ObjectId, ref: "Society" },
  logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
});

module.exports = mongoose.model("Member", memberSchema);

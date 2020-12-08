const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const extraFeeSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  tracks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Track",
    },
  ],
});

module.exports = mongoose.model("ExtraFee", extraFeeSchema);

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const monthFeeSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  description: {
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

module.exports = mongoose.model("MonthFee", monthFeeSchema);

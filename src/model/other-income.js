const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const otherIncomeSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtherIncome", otherIncomeSchema);

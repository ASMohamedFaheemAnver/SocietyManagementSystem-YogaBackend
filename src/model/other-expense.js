const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const otherExpenseSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
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

module.exports = mongoose.model("OtherExpense", otherExpenseSchema);

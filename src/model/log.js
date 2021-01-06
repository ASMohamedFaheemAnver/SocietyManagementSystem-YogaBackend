const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    kind: {
      type: String,
      required: true,
    },
    is_removed: { type: Boolean, default: false, required: true },
    item: { type: Schema.Types.ObjectId, refPath: "kind" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);

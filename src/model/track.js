const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const logSchema = new Schema({
  member: {
    type: Schema.Types.ObjectId,
    ref: "Member",
  },
  is_paid: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Track", logSchema);

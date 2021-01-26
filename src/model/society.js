const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const societySchema = new Schema(
  {
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
    removed_image_urls: [
      {
        type: String,
      },
    ],
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
    expenses: {
      type: Number,
      default: 0,
      required: true,
    },
    total_assets: {
      type: Number,
      default: 0,
      required: true,
    },
    total: {
      assets: {
        type: Number,
        default: 0,
        required: true,
      },
    },
    balance: {
      bank: {
        type: Number,
        default: 0,
        required: true,
      },
      case: {
        type: Number,
        default: 0,
        required: true,
      },
    },
    received: {
      donations: {
        type: Number,
        default: 0,
        // required: true,
      },
    },
    month_fee: {
      type: { description: String, amount: Number },
      default: { description: "Monthly fees.", amount: 100 },
    },
    members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    removed_members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    removed_logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    reset_token: {
      type: String,
    },
    reset_token_expiration: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Society", societySchema);

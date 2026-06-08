const mongoose = require("mongoose");

const pointsTransactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HardwareRequest",
      required: true,
    },
    hardware_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HardwareItem",
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      default: "other",
      trim: true,
    },
    condition: {
      type: String,
      default: "new",
      trim: true,
    },
    owner_scope: {
      type: String,
      enum: ["community", "enterprise"],
      default: "community",
    },
    reason: {
      type: String,
      enum: ["hardware_donation_completed"],
      required: true,
    },
  },
  { timestamps: true },
);

pointsTransactionSchema.index({ request_id: 1, reason: 1 }, { unique: true });
pointsTransactionSchema.index({ user_id: 1, createdAt: -1 });
pointsTransactionSchema.index({ owner_scope: 1, createdAt: -1 });

module.exports = mongoose.model("PointsTransaction", pointsTransactionSchema);

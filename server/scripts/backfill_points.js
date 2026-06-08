const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const HardwareRequest = require("../src/models/HardwareRequest");
const HardwareItem = require("../src/models/HardwareItem");
const PointsTransaction = require("../src/models/PointsTransaction");
const { awardCompletionPoints } = require("../src/services/points.service");

async function backfillPoints() {
  await mongoose.connect(process.env.MONGO_URI);

  const completedRequests = await HardwareRequest.find({
    status: "completed",
    $or: [
      { requester_completed: true },
      { owner_completed: true },
      { requester_completed: { $exists: false } },
      { owner_completed: { $exists: false } },
    ],
  }).sort({ updatedAt: 1 });

  let processed = 0;
  let awarded = 0;
  let skipped = 0;

  for (const request of completedRequests) {
    processed += 1;

    const existingTransaction = await PointsTransaction.findOne({
      request_id: request._id,
      reason: "hardware_donation_completed",
    });

    if (existingTransaction) {
      skipped += 1;
      continue;
    }

    const hardware = await HardwareItem.findById(request.hardware_id).select(
      "category condition owner_type",
    );

    if (!hardware) {
      skipped += 1;
      continue;
    }

    const result = await awardCompletionPoints({
      request,
      hardware,
      now: request.updatedAt || request.createdAt || new Date(),
    });

    if (result.awarded) {
      awarded += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(JSON.stringify({ processed, awarded, skipped }, null, 2));

  await mongoose.disconnect();
}

backfillPoints().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exitCode = 1;
});

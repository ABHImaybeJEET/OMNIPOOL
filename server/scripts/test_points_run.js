const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load env
const rootEnvPath = path.join(__dirname, "../../.env");
dotenv.config({ path: rootEnvPath });

const User = require("../src/models/User");
const HardwareItem = require("../src/models/HardwareItem");
const HardwareRequest = require("../src/models/HardwareRequest");
const PointsTransaction = require("../src/models/PointsTransaction");
const { awardCompletionPoints } = require("../src/services/points.service");

async function runTest() {
  console.log("Connecting to DB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  // 1. Create a dummy user
  const uniqueId = Date.now();
  const testUser = await User.create({
    name: `Test User ${uniqueId}`,
    email: `testuser_${uniqueId}@example.com`,
    password: "password123",
    firebaseUid: `uid_${uniqueId}_1`,
  });
  console.log("Created test user:", testUser.name, "ID:", testUser._id);

  // 2. Create dummy hardware owned by another user (or same, but we need hardware_id)
  const hardwareOwner = await User.create({
    name: `Hardware Owner ${uniqueId}`,
    email: `owner_${uniqueId}@example.com`,
    password: "password123",
    account_type: "community",
    firebaseUid: `uid_${uniqueId}_2`,
  });

  const testHardware = await HardwareItem.create({
    name: "Arduino Uno",
    description: "Test Arduino description",
    category: "microcontrollers",
    condition: "new",
    quantity: 5,
    owner_id: hardwareOwner._id,
    owner_type: "community",
    location: { type: "Point", coordinates: [0, 0] },
  });
  console.log("Created test hardware:", testHardware.name);

  // 3. Create a hardware request from the test user (donor/requester)
  // Wait! Who gets the points?
  // Let's check who points.service.js awards points to.
  // In points.service.js:
  // buildTransactionPayload returns:
  // user_id: request.owner_id
  // Wait! request.owner_id is the owner of the hardware!
  // In omnipool, the point system awards points to the DONOR (owner of hardware) when a request is completed.
  // Let's check: request.owner_id gets the points.
  const testRequest = await HardwareRequest.create({
    hardware_id: testHardware._id,
    requester_id: testUser._id,
    owner_id: hardwareOwner._id,
    quantity_requested: 2,
    status: "accepted",
  });
  console.log("Created test request. Owner (Donor) ID:", testRequest.owner_id);

  // 4. Award points
  console.log("Awarding completion points...");
  const result = await awardCompletionPoints({
    request: testRequest,
    hardware: testHardware,
  });
  console.log("Award points result:", result);

  // 5. Query user details
  const updatedOwner = await User.findById(hardwareOwner._id);
  console.log("Updated donor details:");
  console.log("Points Total:", updatedOwner.points_total);
  console.log("Points Monthly:", updatedOwner.points_monthly);
  console.log("Donated Items Count:", updatedOwner.donated_items_count);
  console.log("Donated Units Count:", updatedOwner.donated_units_count);

  const ledger = await PointsTransaction.findOne({
    request_id: testRequest._id,
  });
  console.log("Ledger entry exists:", Boolean(ledger));

  // 6. Test duplicate prevention
  console.log("Attempting to award points again for the same request...");
  const duplicateResult = await awardCompletionPoints({
    request: testRequest,
    hardware: testHardware,
  });
  console.log("Duplicate award points result:", duplicateResult);

  // Cleanup
  console.log("Cleaning up...");
  await User.deleteOne({ _id: testUser._id });
  await User.deleteOne({ _id: hardwareOwner._id });
  await HardwareItem.deleteOne({ _id: testHardware._id });
  await HardwareRequest.deleteOne({ _id: testRequest._id });
  await PointsTransaction.deleteMany({ request_id: testRequest._id });
  console.log("Cleaned up database entries.");

  await mongoose.disconnect();
  console.log("Done!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  mongoose.disconnect();
});

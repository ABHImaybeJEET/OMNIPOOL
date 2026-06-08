const mongoose = require("mongoose");
const User = require("../models/User");
const PointsTransaction = require("../models/PointsTransaction");
const {
  CATEGORY_WEIGHTS,
  CONDITION_MULTIPLIERS,
  POINTS_RULES,
} = require("../config/points");

const COMPLETION_REASON = "hardware_donation_completed";

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
};

const calculateCompletionPoints = ({ quantity, category, condition }) => {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const categoryWeight =
    CATEGORY_WEIGHTS[category] ?? POINTS_RULES.defaultCategoryWeight;
  const conditionMultiplier =
    CONDITION_MULTIPLIERS[condition] ?? POINTS_RULES.defaultConditionMultiplier;

  const raw =
    (POINTS_RULES.basePoints + safeQuantity * categoryWeight) *
    conditionMultiplier;
  return Math.max(1, Math.round(raw));
};

const buildTransactionPayload = ({ request, hardware, now }) => {
  const quantity = Math.max(1, Number(request.quantity_requested) || 1);
  const category = hardware?.category || "other";
  const condition = hardware?.condition || "new";
  const points = calculateCompletionPoints({ quantity, category, condition });

  return {
    user_id: request.owner_id,
    request_id: request._id,
    hardware_id: request.hardware_id,
    quantity,
    category,
    condition,
    owner_scope:
      hardware?.owner_type === "enterprise" ? "enterprise" : "community",
    points,
    reason: COMPLETION_REASON,
    now,
  };
};

const wasInserted = (result) =>
  Boolean(
    result && result.lastErrorObject && !result.lastErrorObject.updatedExisting,
  );

const upsertLedgerEntry = async (payload, session) => {
  const filter = {
    request_id: payload.request_id,
    reason: payload.reason,
  };

  const update = {
    $setOnInsert: {
      user_id: payload.user_id,
      request_id: payload.request_id,
      hardware_id: payload.hardware_id,
      points: payload.points,
      quantity: payload.quantity,
      category: payload.category,
      condition: payload.condition,
      owner_scope: payload.owner_scope,
      reason: payload.reason,
    },
  };

  return PointsTransaction.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    includeResultMetadata: true,
    session,
  });
};

const applyUserPointIncrements = async (payload, session) => {
  const { start, end } = getMonthRange(payload.now);
  const isCurrentMonth = payload.now >= start && payload.now < end;

  const increment = {
    points_total: payload.points,
    donated_items_count: 1,
    donated_units_count: payload.quantity,
  };

  if (isCurrentMonth) {
    increment.points_monthly = payload.points;
  }

  return User.updateOne(
    { _id: payload.user_id },
    {
      $inc: increment,
      $set: { last_points_awarded_at: payload.now },
    },
    { session },
  );
};

const isTransactionUnsupported = (error) =>
  Boolean(
    error &&
    /Transaction numbers are only allowed|replica set member|mongos/i.test(
      String(error.message || ""),
    ),
  );

const awardCompletionPoints = async ({
  request,
  hardware,
  now = new Date(),
}) => {
  if (!request || !request._id || !request.owner_id || !request.hardware_id) {
    return { awarded: false, reason: "invalid_request" };
  }

  const payload = buildTransactionPayload({
    request,
    hardware,
    now,
  });

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const ledgerResult = await upsertLedgerEntry(payload, session);
    if (!wasInserted(ledgerResult)) {
      await session.abortTransaction();
      return { awarded: false, reason: "already_awarded" };
    }

    await applyUserPointIncrements(payload, session);
    await session.commitTransaction();

    return {
      awarded: true,
      points: payload.points,
      scope: payload.owner_scope,
    };
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {
        // no-op
      }
    }

    if (!isTransactionUnsupported(error)) {
      throw error;
    }

    const ledgerResult = await upsertLedgerEntry(payload);
    if (!wasInserted(ledgerResult)) {
      return { awarded: false, reason: "already_awarded" };
    }

    await applyUserPointIncrements(payload);
    return {
      awarded: true,
      points: payload.points,
      scope: payload.owner_scope,
    };
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  COMPLETION_REASON,
  calculateCompletionPoints,
  awardCompletionPoints,
};

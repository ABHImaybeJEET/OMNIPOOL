const HardwareRequest = require("../models/HardwareRequest");
const HardwareItem = require("../models/HardwareItem");
const ChatMessage = require("../models/ChatMessage");
const { awardCompletionPoints } = require("../services/points.service");

/**
 * POST /api/requests
 * Create a new hardware request
 */
const createRequest = async (req, res, next) => {
  try {
    const { hardware_id, quantity_requested, message } = req.body;

    const hardware = await HardwareItem.findById(hardware_id);
    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    if (String(hardware.owner_id) === String(req.userId)) {
      return res.status(400).json({
        success: false,
        error: "You cannot request your own hardware",
      });
    }

    if (quantity_requested < 1 || quantity_requested > hardware.quantity) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid quantity requested" });
    }

    const existingPending = await HardwareRequest.findOne({
      hardware_id,
      requester_id: req.userId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: "You already have a pending request for this item",
      });
    }

    const request = await HardwareRequest.create({
      hardware_id,
      requester_id: req.userId,
      owner_id: hardware.owner_id,
      quantity_requested: quantity_requested || 1,
      message: message || "",
    });

    const requestDetails = [
      `New hardware request`,
      `Item: ${hardware.name}`,
      `Quantity: ${quantity_requested || 1}`,
      `Status: Pending approval`,
      message ? `Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const initialChatMessage = await ChatMessage.create({
      request_id: request._id,
      sender_id: req.userId,
      receiver_id: hardware.owner_id,
      message: requestDetails,
    });

    const populated = await HardwareRequest.findById(request._id)
      .populate("hardware_id", "name category image_url quantity")
      .populate("requester_id", "name email avatar_url")
      .populate("owner_id", "name email avatar_url");

    const populatedInitialMessage = await ChatMessage.findById(
      initialChatMessage._id,
    )
      .populate("sender_id", "name email avatar_url")
      .populate("receiver_id", "name email avatar_url");

    // Emit socket event if io is available
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(`user_${hardware.owner_id}`).emit("new_request", populated);
      io.to(`user_${req.userId}`).emit("new_request", populated);
      io.to(`chat_${request._id}`).emit("new_request", populated);
      io.to(`chat_${request._id}`).emit("new_message", populatedInitialMessage);
      io.to(`user_${hardware.owner_id}`).emit("message_notification", {
        request_id: request._id,
        sender: populatedInitialMessage.sender_id,
        preview: requestDetails.split("\n")[0],
      });
    }

    res.status(201).json({
      success: true,
      data: {
        request: populated,
        initial_message: populatedInitialMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests
 * Get requests for a user (as requester or owner via query param role)
 */
const getRequests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role === "owner") {
      filter.owner_id = req.userId;
    } else {
      filter.requester_id = req.userId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await HardwareRequest.find(filter)
      .populate("hardware_id", "name category image_url quantity brand")
      .populate("requester_id", "name email avatar_url")
      .populate("owner_id", "name email avatar_url")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/requests/:id
 * Update request status (owner only)
 */
const updateRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["accepted", "rejected", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid status update" });
    }

    let request = await HardwareRequest.findById(req.params.id);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    const isOwner = String(request.owner_id) === String(req.userId);
    const isRequester = String(request.requester_id) === String(req.userId);

    if (!isOwner && !isRequester) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this request",
      });
    }

    // Owners can accept/reject pending requests; accepted requests can be completed by either participant.
    if (status === "accepted" || status === "rejected") {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: "Only the owner can accept or reject requests",
        });
      }
      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Only pending requests can be accepted or rejected",
        });
      }
    }

    let pointsAwardResult = null;
    if (status === "completed") {
      if (request.status !== "accepted") {
        return res.status(400).json({
          success: false,
          error: "Only accepted requests can be completed",
        });
      }

      const completionField = isOwner
        ? "owner_completed"
        : "requester_completed";
      request = await HardwareRequest.findByIdAndUpdate(
        request._id,
        { $set: { [completionField]: true } },
        { new: true },
      );

      if (!request) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      if (request.owner_completed && request.requester_completed) {
        const completedRequest = await HardwareRequest.findOneAndUpdate(
          {
            _id: request._id,
            status: { $ne: "completed" },
            owner_completed: true,
            requester_completed: true,
          },
          { $set: { status: "completed" } },
          { new: true },
        );

        if (completedRequest) {
          request = completedRequest;
        }
      }
    } else {
      // Reduce stock when request is accepted.
      if (status === "accepted") {
        const hardware = await HardwareItem.findById(request.hardware_id);
        if (!hardware) {
          return res
            .status(404)
            .json({ success: false, error: "Hardware not found" });
        }

        if (hardware.quantity < request.quantity_requested) {
          return res.status(400).json({
            success: false,
            error: "Insufficient quantity available to accept this request",
          });
        }

        hardware.quantity -= request.quantity_requested;
        if (hardware.quantity <= 0) {
          hardware.availability_status = "in-use";
        }
        await hardware.save();
      }

      request.status = status;
    }

    const becameCompleted = request.status === "completed";
    await request.save();

    if (becameCompleted) {
      const hardware = await HardwareItem.findById(request.hardware_id).select(
        "category condition owner_type",
      );
      pointsAwardResult = await awardCompletionPoints({ request, hardware });
    }

    const populated = await HardwareRequest.findById(request._id)
      .populate("hardware_id", "name category image_url quantity")
      .populate("requester_id", "name email avatar_url")
      .populate("owner_id", "name email avatar_url");

    // Emit socket event
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(`chat_${request._id}`).emit("request_update", populated);
      io.to(`user_${request.requester_id}`).emit("request_update", populated);
      io.to(`user_${request.owner_id}`).emit("request_update", populated);
    }

    res.json({
      success: true,
      data: populated,
      meta: pointsAwardResult ? { points_award: pointsAwardResult } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/requests/:id
 * Delete a request conversation and its messages when it is not active.
 */
const deleteRequest = async (req, res, next) => {
  try {
    const request = await HardwareRequest.findById(req.params.id);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    const isOwner = String(request.owner_id) === String(req.userId);
    const isRequester = String(request.requester_id) === String(req.userId);

    if (!isOwner && !isRequester) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this chat",
      });
    }

    if (request.status === "accepted") {
      return res.status(400).json({
        success: false,
        error: "Accepted requests cannot be deleted from chat",
      });
    }

    await ChatMessage.deleteMany({ request_id: request._id });
    await request.deleteOne();

    if (req.app.get("io")) {
      const io = req.app.get("io");
      const payload = { request_id: String(request._id) };
      io.to(`user_${request.requester_id}`).emit(
        "conversation_deleted",
        payload,
      );
      io.to(`user_${request.owner_id}`).emit("conversation_deleted", payload);
      io.to(`chat_${request._id}`).emit("conversation_deleted", payload);
    }

    res.json({ success: true, data: { request_id: String(request._id) } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/requests/:id/messages
 * Clear the message history for a request without deleting the request itself.
 */
const clearRequestMessages = async (req, res, next) => {
  try {
    const request = await HardwareRequest.findById(req.params.id);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    const isOwner = String(request.owner_id) === String(req.userId);
    const isRequester = String(request.requester_id) === String(req.userId);

    if (!isOwner && !isRequester) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to clear this chat",
      });
    }

    await ChatMessage.deleteMany({ request_id: request._id });

    if (req.app.get("io")) {
      const io = req.app.get("io");
      const payload = { request_id: String(request._id) };
      io.to(`user_${request.requester_id}`).emit("chat_cleared", payload);
      io.to(`user_${request.owner_id}`).emit("chat_cleared", payload);
      io.to(`chat_${request._id}`).emit("chat_cleared", payload);
    }

    res.json({ success: true, data: { request_id: String(request._id) } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  clearRequestMessages,
};

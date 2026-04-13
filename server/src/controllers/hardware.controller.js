const HardwareItem = require("../models/HardwareItem");
const { generateEmbedding } = require("../services/embedding.service");
const User = require("../models/User");

/**
 * GET /api/hardware
 */
const getHardware = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.availability_status = req.query.status;
    if (req.query.owner) filter.owner_id = req.query.owner;

    const hardware = await HardwareItem.find(filter)
      .populate("owner_id", "name email avatar_url")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: hardware });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/hardware
 */
const createHardware = async (req, res, next) => {
  try {
    const { name, description, category, specs, image_url, location } =
      req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUid });

    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Generate description embedding
    const embeddingText = `${name} ${description} ${category || ""}`;
    const item_description_embedding = await generateEmbedding(embeddingText);

    const hardware = await HardwareItem.create({
      name,
      description,
      owner_id: user._id,
      category: category || "other",
      specs: specs || {},
      image_url: image_url || "",
      item_description_embedding,
      location: location || { type: "Point", coordinates: [0, 0] },
    });

    res.status(201).json({ success: true, data: hardware });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hardware/:id
 */
const getHardwareById = async (req, res, next) => {
  try {
    const hardware = await HardwareItem.findById(req.params.id).populate(
      "owner_id",
      "name email avatar_url",
    );

    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    res.json({ success: true, data: hardware });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hardware/:id
 */
const updateHardware = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const existing = await HardwareItem.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    if (existing.owner_id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const {
      name,
      description,
      category,
      specs,
      image_url,
      availability_status,
    } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (specs) updateData.specs = specs;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (availability_status)
      updateData.availability_status = availability_status;

    // Regenerate embedding if name or description changed
    if (name || description) {
      const embeddingText = `${name || existing.name} ${description || existing.description} ${category || existing.category}`;
      updateData.item_description_embedding =
        await generateEmbedding(embeddingText);
    }

    const hardware = await HardwareItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate("owner_id", "name email avatar_url");

    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    res.json({ success: true, data: hardware });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/hardware/:id
 */
const deleteHardware = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const existing = await HardwareItem.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    if (existing.owner_id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const hardware = await HardwareItem.findByIdAndDelete(req.params.id);
    if (!hardware)
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHardware,
  createHardware,
  getHardwareById,
  updateHardware,
  deleteHardware,
};

const HardwareItem = require("../models/HardwareItem");
const User = require("../models/User");
const { generateEmbedding } = require("../services/embedding.service");

/**
 * GET /api/hardware
 */
const getHardware = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.availability_status = req.query.status;
    if (req.query.owner) filter.owner_id = req.query.owner;

    if (req.query.latitude && req.query.longitude) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const maxDistance = parseFloat(req.query.maxDistance) || 100000; // default 100km

      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [longitude, latitude]
          },
          $maxDistance: maxDistance,
        },
      };
    }

    let query = HardwareItem.find(filter).populate(
      "owner_id",
      "name email avatar_url company_name account_type role",
    );

    // If we do geo-queries, it sorts by distance automatically, so don't sort by createdAt.
    if (!req.query.latitude || !req.query.longitude) {
      query = query.sort({ createdAt: -1 });
    }

    const hardware = await query.limit(50);

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
    const {
      name,
      description,
      category,
      sub_category,
      specs,
      image_url,
      location,
      location_name,
      quantity,
      owner_type,
      brand,
      condition,
    } = req.body;

    const owner = await User.findById(req.userId || req.body.owner_id);
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, error: "Owner user not found" });
    }

    let normalizedOwnerType = owner_type || "community";
    const isEnterpriseApproved =
      owner.account_type === "enterprise" &&
      owner.enterprise_status === "accepted";
    if (normalizedOwnerType === "enterprise" && !isEnterpriseApproved) {
      return res.status(403).json({
        success: false,
        error: "Only accepted enterprise users can list enterprise hardware",
      });
    }

    if (!isEnterpriseApproved) {
      normalizedOwnerType = "community";
    }

    // Generate description embedding
    const embeddingText = `${name} ${description} ${category || ""}`;
    const item_description_embedding = await generateEmbedding(embeddingText);

    const hardware = await HardwareItem.create({
      name,
      description,
      owner_id: req.userId || req.body.owner_id,
      category: category || "other",
      sub_category: sub_category || "",
      specs: specs || {},
      image_url: image_url || "",
      item_description_embedding,
      location: location || { type: "Point", coordinates: [0, 0] },
      location_name: location_name || "",
      quantity: quantity || 1,
      owner_type: normalizedOwnerType,
      brand: brand || "",
      condition: condition || "new",
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
      "name email avatar_url company_name account_type role",
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
    const currentHardware = await HardwareItem.findById(req.params.id);
    if (!currentHardware) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    if (String(currentHardware.owner_id) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        error: "You can only edit hardware that you own",
      });
    }

    const {
      name,
      description,
      category,
      sub_category,
      specs,
      image_url,
      availability_status,
      quantity,
      owner_type,
      brand,
      condition,
      location,
      location_name,
    } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (sub_category !== undefined) updateData.sub_category = sub_category;
    if (specs) updateData.specs = specs;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (availability_status)
      updateData.availability_status = availability_status;
    if (quantity !== undefined) {
      updateData.quantity = Math.max(1, Number(quantity) || 1);
    }
    if (brand !== undefined) updateData.brand = brand;
    if (condition) updateData.condition = condition;
    if (location) updateData.location = location;
    if (location_name !== undefined) updateData.location_name = location_name;

    if (owner_type) {
      const owner = await User.findById(req.userId);
      if (!owner) {
        return res
          .status(404)
          .json({ success: false, error: "Owner user not found" });
      }

      const isEnterpriseApproved =
        owner.account_type === "enterprise" &&
        owner.enterprise_status === "accepted";

      if (owner_type === "enterprise" && !isEnterpriseApproved) {
        return res.status(403).json({
          success: false,
          error: "Only accepted enterprise users can list enterprise hardware",
        });
      }

      updateData.owner_type = isEnterpriseApproved ? owner_type : "community";
    }

    // Regenerate embedding if name or description changed
    if (name || description) {
      const current = await HardwareItem.findById(req.params.id);
      const embeddingText = `${name || current.name} ${description || current.description} ${category || current.category}`;
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
    ).populate(
      "owner_id",
      "name email avatar_url company_name account_type role",
    );

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
    const hardware = await HardwareItem.findById(req.params.id);
    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, error: "Hardware not found" });
    }

    if (String(hardware.owner_id) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        error: "You can only delete hardware that you own",
      });
    }

    await hardware.deleteOne();
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

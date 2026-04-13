const User = require("../models/User");
const { generateAverageEmbedding } = require("../services/embedding.service");

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-skills_embedding")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/sync
 */
const syncUser = async (req, res, next) => {
  try {
    const firebaseUid = req.firebaseUid;
    const tokenPayload = req.firebaseToken || {};
    const email = (tokenPayload.email || "").toLowerCase();
    const incomingName = (tokenPayload.name || req.body?.name || "").trim();

    if (!firebaseUid || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Missing Firebase user metadata" });
    }

    const existing = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    });

    let user;

    if (existing) {
      if (existing.firebaseUid !== firebaseUid) {
        existing.firebaseUid = firebaseUid;
      }

      if (existing.email !== email) {
        existing.email = email;
      }

      if (!existing.name && incomingName) {
        existing.name = incomingName;
      }

      user = await existing.save();
    } else {
      user = await User.create({
        firebaseUid,
        email,
        name: incomingName || email.split("@")[0],
        skills: [],
        skills_embedding: [],
        bio: "",
        project_history: [],
        location: { type: "Point", coordinates: [0, 0] },
        avatar_url: "",
        availability: true,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        error:
          "A profile with this email already exists. Sign in with the original provider, then link Google or password from Firebase.",
      });
    }

    next(error);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-skills_embedding")
      .populate("project_history");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (currentUser._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const { name, skills, bio, availability, location } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (availability !== undefined) updateData.availability = availability;
    if (location) updateData.location = location;

    if (skills) {
      updateData.skills = skills;
      updateData.skills_embedding = await generateAverageEmbedding(skills);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-skills_embedding");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, syncUser, getUserById, updateUser };

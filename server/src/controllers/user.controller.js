const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAverageEmbedding } = require("../services/embedding.service");

const VALID_LEADERBOARD_SCOPES = ["community", "enterprise", "all"];
const VALID_LEADERBOARD_PERIODS = ["all", "monthly"];

const getLeaderboardFilter = (scope) => {
  if (scope === "community") {
    return { account_type: "community" };
  }

  if (scope === "enterprise") {
    return { account_type: "enterprise", enterprise_status: "accepted" };
  }

  return {};
};

const normalizeScope = (scope) =>
  VALID_LEADERBOARD_SCOPES.includes(scope) ? scope : "all";

const normalizePeriod = (period) =>
  VALID_LEADERBOARD_PERIODS.includes(period) ? period : "all";

const getSortField = (period) =>
  period === "monthly" ? "points_monthly" : "points_total";

const buildAuthUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  firebaseUid: user.firebaseUid,
  skills: user.skills,
  bio: user.bio,
  avatar_url: user.avatar_url,
  role: user.role,
  account_type: user.account_type,
  enterprise_status: user.enterprise_status,
  company_name: user.company_name,
  company_website: user.company_website,
  gst_number: user.gst_number,
  points_total: user.points_total || 0,
  points_monthly: user.points_monthly || 0,
  donated_items_count: user.donated_items_count || 0,
  donated_units_count: user.donated_units_count || 0,
  token,
});

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -skills_embedding")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users (Register)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, skills, bio, location, firebaseUid } =
      req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate skills embedding
    let skills_embedding = [];
    if (skills && skills.length > 0) {
      skills_embedding = await generateAverageEmbedding(skills);
    }

    const user = await User.create({
      name,
      email,
      firebaseUid: firebaseUid || email,
      password: hashedPassword,
      skills: skills || [],
      skills_embedding,
      bio: bio || "",
      location: location || { type: "Point", coordinates: [0, 0] },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      data: buildAuthUserResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/login
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: buildAuthUserResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/google
 * Handle Firebase Google login automatically registering if unknown
 */
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, avatar_url, firebaseUid } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required for Google Auth" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register using random password since it's a required field in schema
      const randomPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).toUpperCase().slice(-5) +
        "!";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        firebaseUid: firebaseUid || email,
        password: hashedPassword,
        avatar_url: avatar_url || "",
      });
    } else if (firebaseUid && user.firebaseUid !== firebaseUid) {
      user.firebaseUid = firebaseUid;
      if (name) user.name = name;
      if (avatar_url) user.avatar_url = avatar_url;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: buildAuthUserResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/sync
 * Sync a Firebase-authenticated user into MongoDB without duplicate inserts
 */
const syncUser = async (req, res, next) => {
  try {
    const { firebaseUid, email, name, avatar_url } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        success: false,
        error: "firebaseUid and email are required",
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    let user = await User.findOne({
      $or: [{ firebaseUid }, { email: normalizedEmail }],
    }).select("+password");

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).toUpperCase().slice(-5) +
        "!";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        firebaseUid,
        password: hashedPassword,
        avatar_url: avatar_url || "",
      });
    } else {
      user.firebaseUid = firebaseUid;
      user.email = normalizedEmail;
      if (name) user.name = name;
      if (avatar_url) user.avatar_url = avatar_url;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: buildAuthUserResponse(user, token),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -skills_embedding")
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
    const { name, skills, bio, availability, location } = req.body;
    const updateData = {};

    // Handle 'self' as a special case for authenticated users
    let userId = req.params.id;
    if (userId === "self") {
      userId = req.userId || req.user?._id;
      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            error: "Unauthorized: Cannot identify user",
          });
      }
    }

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (availability !== undefined) updateData.availability = availability;
    if (location) updateData.location = location;

    if (skills) {
      updateData.skills = skills;
      updateData.skills_embedding = await generateAverageEmbedding(skills);
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -skills_embedding");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/enterprise/applications
 * Admin only: get all pending enterprise applications
 */
const getEnterpriseApplications = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized: Admin only" });
    }

    // Default to pending but allow filtering
    const status = req.query.status || "pending";

    const applications = await User.find({ enterprise_status: status }).select(
      "-password -skills_embedding",
    );

    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/enterprise/:id/status
 * Admin only: update enterprise application status
 */
const updateEnterpriseStatus = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized: Admin only" });
    }

    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, error: "Status must be accepted or rejected" });
    }

    // If accepted, upgrade account_type to 'enterprise'
    // If rejected or pending, ensure it drops back to 'community'
    const account_type = status === "accepted" ? "enterprise" : "community";

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        enterprise_status: status,
        account_type: account_type,
      },
      { new: true, runValidators: true },
    ).select("-password -skills_embedding");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/enterprise
 * Apply for enterprise account
 */
const applyEnterprise = async (req, res, next) => {
  try {
    const { company_name, company_website, gst_number } = req.body;

    if (!company_name) {
      return res
        .status(400)
        .json({ success: false, error: "Company name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        enterprise_status: "pending",
        company_name,
        company_website: company_website || "",
        gst_number: gst_number || "",
      },
      { new: true, runValidators: true },
    ).select("-password -skills_embedding");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const scope = normalizeScope(req.query.scope);
    const period = normalizePeriod(req.query.period);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const sortField = getSortField(period);

    const filter = {
      ...getLeaderboardFilter(scope),
      [sortField]: { $gt: 0 },
    };

    const users = await User.find(filter)
      .select(
        "name email avatar_url company_name account_type enterprise_status points_total points_monthly donated_items_count donated_units_count createdAt",
      )
      .sort({
        [sortField]: -1,
        donated_units_count: -1,
        createdAt: 1,
      })
      .limit(limit);

    const data = users.map((user, index) => ({
      rank: index + 1,
      user_id: user._id,
      name: user.name,
      company_name: user.company_name || "",
      avatar_url: user.avatar_url || "",
      account_type: user.account_type,
      enterprise_status: user.enterprise_status,
      points_total: user.points_total || 0,
      points_monthly: user.points_monthly || 0,
      donated_items_count: user.donated_items_count || 0,
      donated_units_count: user.donated_units_count || 0,
    }));

    res.json({
      success: true,
      data,
      meta: { scope, period, sort_field: sortField, limit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/rank
 */
const getMyRank = async (req, res, next) => {
  try {
    const scope = normalizeScope(req.query.scope);
    const period = normalizePeriod(req.query.period);
    const sortField = getSortField(period);
    const filter = getLeaderboardFilter(scope);

    const me = await User.findById(req.userId).select(
      "name account_type enterprise_status points_total points_monthly donated_units_count donated_items_count createdAt",
    );

    if (!me) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (
      scope === "enterprise" &&
      !(me.account_type === "enterprise" && me.enterprise_status === "accepted")
    ) {
      return res.json({
        success: true,
        data: {
          rank: null,
          eligible: false,
          scope,
          period,
          points_total: me.points_total || 0,
          points_monthly: me.points_monthly || 0,
        },
      });
    }

    if (scope === "community" && me.account_type !== "community") {
      return res.json({
        success: true,
        data: {
          rank: null,
          eligible: false,
          scope,
          period,
          points_total: me.points_total || 0,
          points_monthly: me.points_monthly || 0,
        },
      });
    }

    const myPoints = me[sortField] || 0;
    if (myPoints <= 0) {
      return res.json({
        success: true,
        data: {
          rank: null,
          eligible: false,
          scope,
          period,
          points_total: me.points_total || 0,
          points_monthly: me.points_monthly || 0,
          donated_items_count: me.donated_items_count || 0,
          donated_units_count: me.donated_units_count || 0,
        },
      });
    }

    const myUnits = me.donated_units_count || 0;

    const aheadCount = await User.countDocuments({
      ...filter,
      $or: [
        { [sortField]: { $gt: myPoints } },
        { [sortField]: myPoints, donated_units_count: { $gt: myUnits } },
        {
          [sortField]: myPoints,
          donated_units_count: myUnits,
          createdAt: { $lt: me.createdAt },
        },
      ],
    });

    res.json({
      success: true,
      data: {
        rank: aheadCount + 1,
        eligible: true,
        scope,
        period,
        points_total: me.points_total || 0,
        points_monthly: me.points_monthly || 0,
        donated_items_count: me.donated_items_count || 0,
        donated_units_count: me.donated_units_count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  loginUser,
  googleAuth,
  syncUser,
  getUserById,
  updateUser,
  applyEnterprise,
  getEnterpriseApplications,
  updateEnterpriseStatus,
  getLeaderboard,
  getMyRank,
};

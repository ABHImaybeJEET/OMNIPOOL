const ProjectRequest = require("../models/ProjectRequest");
const User = require("../models/User");

/**
 * GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.user) filter.user_id = req.query.user;
    if (req.query.status) filter.status = req.query.status;

    const projects = await ProjectRequest.find(filter)
      .populate("user_id", "name email avatar_url")
      .populate("matched_hardware", "name category availability_status")
      .populate("matched_mentors", "name skills availability")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { title, raw_description } = req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUid });

    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const project = await ProjectRequest.create({
      title,
      raw_description,
      user_id: user._id,
      status: "draft",
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await ProjectRequest.findById(req.params.id)
      .populate("user_id", "name email avatar_url")
      .populate("matched_hardware")
      .populate("matched_mentors", "name skills bio availability");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const existing = await ProjectRequest.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    if (existing.user_id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updateData = {};
    const allowedFields = [
      "title",
      "raw_description",
      "extrapolated_BOM",
      "required_skills",
      "matched_hardware",
      "matched_mentors",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const project = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProjectById, updateProject };

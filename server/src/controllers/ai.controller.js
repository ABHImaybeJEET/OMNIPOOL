const { parseProjectDescription } = require("../services/gemini.service");
const { generateEmbedding } = require("../services/embedding.service");
const {
  searchHardware,
  searchMentors,
} = require("../services/vectorSearch.service");
const {
  getMockHardwareMatches,
  getMockMentorMatches,
} = require("../utils/mockData");
const { isGeminiConfigured } = require("../config/gemini");
const ProjectRequest = require("../models/ProjectRequest");
const User = require("../models/User");

/**
 * POST /api/ai/parse-project
 * Parse a natural-language project description into structured BOM + skills.
 */
const parseProject = async (req, res, next) => {
  try {
    const { raw_description } = req.body;

    if (!raw_description || raw_description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "raw_description is required",
      });
    }

    const result = await parseProjectDescription(raw_description);

    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const project = await ProjectRequest.create({
      title: result.title || "Untitled Project",
      raw_description,
      user_id: user._id,
      extrapolated_BOM: result.extrapolated_BOM,
      required_skills: result.required_skills,
      status: "parsed",
    });

    res.status(200).json({
      success: true,
      data: {
        ...result,
        project_id: project?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/match-resources
 * Given parsed BOM + skills, find matching hardware and mentors.
 */
const matchResources = async (req, res, next) => {
  try {
    const { extrapolated_BOM, required_skills } = req.body;

    if (!extrapolated_BOM && !required_skills) {
      return res.status(400).json({
        success: false,
        error: "extrapolated_BOM or required_skills is required",
      });
    }

    let matchedHardware = [];
    let matchedMentors = [];

    if (isGeminiConfigured()) {
      // Generate embeddings and search
      if (extrapolated_BOM && extrapolated_BOM.length > 0) {
        const bomText = extrapolated_BOM.map((b) => b.hardware_name).join(", ");
        const bomEmbedding = await generateEmbedding(bomText);
        matchedHardware = await searchHardware(bomEmbedding, {
          availability_status: "available",
        });
      }

      if (required_skills && required_skills.length > 0) {
        const skillsText = required_skills.join(", ");
        const skillsEmbedding = await generateEmbedding(skillsText);
        matchedMentors = await searchMentors(skillsEmbedding, {
          availability: true,
        });
      }
    } else {
      // Mock responses
      matchedHardware = getMockHardwareMatches();
      matchedMentors = getMockMentorMatches();
    }

    res.status(200).json({
      success: true,
      data: {
        matched_hardware: matchedHardware,
        matched_mentors: matchedMentors,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { parseProject, matchResources };

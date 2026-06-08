const { parseProjectDescription, generateProjectAdvice } = require('../services/gemini.service');
const { generateEmbedding } = require('../services/embedding.service');
const { searchHardware, searchMentors } = require('../services/vectorSearch.service');
const { isGeminiConfigured } = require('../config/gemini');
const ProjectRequest = require('../models/ProjectRequest');

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
        error: 'raw_description is required',
      });
    }

    const result = await parseProjectDescription(raw_description);

    // Optionally save as a draft project
    let project = null;
    try {
      if (req.userId) {
        project = await ProjectRequest.create({
          title: result.title || 'Untitled Project',
          raw_description,
          user_id: req.userId,
          extrapolated_BOM: result.extrapolated_BOM,
          required_skills: result.required_skills,
          status: 'parsed',
        });
      }
    } catch (dbError) {
      console.warn('Could not save project request to DB:', dbError.message);
    }

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
        error: 'extrapolated_BOM or required_skills is required',
      });
    }

    let matchedHardware = [];
    let matchedMentors = [];

    // Generate embeddings and search
    try {
      if (extrapolated_BOM && extrapolated_BOM.length > 0) {
        const bomText = extrapolated_BOM.map((b) => b.hardware_name).join(', ');
        const bomEmbedding = await generateEmbedding(bomText);
        matchedHardware = await searchHardware(bomEmbedding, { availability_status: 'available' });
      }

      if (required_skills && required_skills.length > 0) {
        const skillsText = required_skills.join(', ');
        const skillsEmbedding = await generateEmbedding(skillsText);
        matchedMentors = await searchMentors(skillsEmbedding, { availability: true });
      }
    } catch (dbError) {
      console.warn('Resource matching failed due to DB issue:', dbError.message);
      // Fallback to empty results to allow advice generation to proceed
      matchedHardware = matchedHardware || [];
      matchedMentors = matchedMentors || [];
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

/**
 * POST /api/ai/get-advice
 * Grounded generation: Takes raw description and matched resources to give advice.
 */
const getAdvice = async (req, res, next) => {
  try {
    const { raw_description, matched_hardware, matched_mentors } = req.body;

    if (!raw_description) {
      return res.status(400).json({
        success: false,
        error: 'raw_description is required',
      });
    }

    const advice = await generateProjectAdvice(
      raw_description,
      matched_hardware || [],
      matched_mentors || []
    );

    res.status(200).json({
      success: true,
      data: advice,
    });
  } catch (error) {
    next(error);
  }
};

const AiConversation = require('../models/AiConversation');

/**
 * POST /api/ai/conversations
 * Save a new conversation record.
 */
const createConversation = async (req, res, next) => {
  try {
    const { title, prompt, aiResult, projectAdvice } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required',
      });
    }

    const conversation = await AiConversation.create({
      user_id: req.userId,
      title: title || aiResult?.title || prompt.substring(0, 50) + '...',
      prompt,
      aiResult,
      projectAdvice,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/conversations
 * Get all conversations for active user.
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await AiConversation.find({ user_id: req.userId })
      .select('title prompt createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/conversations/:id
 * Get single conversation details.
 */
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await AiConversation.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/ai/conversations/:id
 * Delete a conversation.
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await AiConversation.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  parseProject,
  matchResources,
  getAdvice,
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
};

const express = require('express');
const router = express.Router();
const {
  parseProject,
  matchResources,
  getAdvice,
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
} = require('../controllers/ai.controller');
const auth = require('../middleware/auth');

router.post('/parse-project', auth, parseProject);
router.post('/match-resources', auth, matchResources);
router.post('/get-advice', auth, getAdvice);

// AI Conversation History Routes
router.post('/conversations', auth, createConversation);
router.get('/conversations', auth, getConversations);
router.get('/conversations/:id', auth, getConversationById);
router.delete('/conversations/:id', auth, deleteConversation);

module.exports = router;

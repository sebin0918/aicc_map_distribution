const express = require('express');
const { postChatbotData } = require('../controllers/chatbotController');
const router = express.Router();

router.post('/chatbot', postChatbotData); // POST 요청 추가

module.exports = router;
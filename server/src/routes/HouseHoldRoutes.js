const express = require('express');
const { getHouseHoldData } = require('../controllers/HouseHoldController');
//const houseHoldRoutes = require('./src/routes/HouseHold'); // 정확한 경로와 파일명으로 수정
const router = express.Router();
router.get('/HouseHold', getHouseHoldData);
module.exports = router;
const express = require('express');
const {
  getAllHouses,
  getHouseById,
} = require('../controllers/houseController');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/houses - جميع البيوت (مع فلترة ?type=, ?page=, ?limit=)
// optionalAuthenticate: يميّز الأدمن المسجّل عن الزائر ليُحترم ?includeHidden=true له فقط.
router.get('/', optionalAuthenticate, getAllHouses);

// GET /api/houses/:id - تفاصيل بيت واحد
router.get('/:id', getHouseById);

module.exports = router;

const express = require('express');
const {
  getAllLands,
  getLandById,
} = require('../controllers/landController');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/lands - جميع الأراضي (مع فلترة ?type=, ?page=, ?limit=)
// optionalAuthenticate: يميّز الأدمن المسجّل عن الزائر ليُحترم ?includeHidden=true له فقط.
router.get('/', optionalAuthenticate, getAllLands);

// GET /api/lands/:id - تفاصيل أرض واحدة
router.get('/:id', getLandById);

module.exports = router;

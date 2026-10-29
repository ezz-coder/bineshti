const express = require('express');
const {
  getAllVillas,
  getVillaById,
} = require('../controllers/villaController');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/villas - جميع الفلل (مع فلترة ?type=, ?page=, ?limit=)
// optionalAuthenticate: يميّز الأدمن المسجّل عن الزائر ليُحترم ?includeHidden=true له فقط.
router.get('/', optionalAuthenticate, getAllVillas);

// GET /api/villas/:id - تفاصيل فيلا واحدة
router.get('/:id', getVillaById);

module.exports = router;

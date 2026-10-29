const express = require('express');
const {
  getAllApartments,
  getApartmentById,
} = require('../controllers/apartmentController');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/apartments - جميع الشقق (مع فلترة ?type=, ?page=, ?limit=)
// optionalAuthenticate: يميّز الأدمن المسجّل عن الزائر ليُحترم ?includeHidden=true له فقط.
router.get('/', optionalAuthenticate, getAllApartments);

// GET /api/apartments/:id - تفاصيل شقة واحدة
router.get('/:id', getApartmentById);

module.exports = router;

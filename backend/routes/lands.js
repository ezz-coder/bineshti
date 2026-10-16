const express = require('express');
const {
  getAllLands,
  getLandById,
} = require('../controllers/landController');

const router = express.Router();

// GET /api/lands - جميع الأراضي (مع فلترة ?type=, ?page=, ?limit=)
router.get('/', getAllLands);

// GET /api/lands/:id - تفاصيل أرض واحدة
router.get('/:id', getLandById);

module.exports = router;

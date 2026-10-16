const express = require('express');
const {
  getAllVillas,
  getVillaById,
} = require('../controllers/villaController');

const router = express.Router();

// GET /api/villas - جميع الفلل (مع فلترة ?type=, ?page=, ?limit=)
router.get('/', getAllVillas);

// GET /api/villas/:id - تفاصيل فيلا واحدة
router.get('/:id', getVillaById);

module.exports = router;

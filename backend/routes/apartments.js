const express = require('express');
const {
  getAllApartments,
  getApartmentById,
} = require('../controllers/apartmentController');

const router = express.Router();

// GET /api/apartments - جميع الشقق (مع فلترة ?type=)
router.get('/', getAllApartments);

// GET /api/apartments/:id - تفاصيل شقة واحدة
router.get('/:id', getApartmentById);

module.exports = router;

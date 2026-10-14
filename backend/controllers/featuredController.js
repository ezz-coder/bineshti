const apartmentModel = require('../models/apartmentModel');
const villaModel = require('../models/villaModel');
const landModel = require('../models/landModel');

/**
 * متحكم العناصر المميزة - يجلب العقارات المميزة من جميع الأقسام
 */

// GET /api/featured - العناصر المميزة في الصفحة الرئيسية
async function getFeatured(req, res) {
  const featuredApartments = apartmentModel.getAll().filter((a) => a.isFeatured);
  const featuredVillas = villaModel.getAll().filter((v) => v.isFeatured);
  const featuredLands = landModel.getAll().filter((l) => l.isFeatured);

  res.status(200).json({
    success: true,
    data: {
      apartments: featuredApartments,
      villas: featuredVillas,
      lands: featuredLands,
    },
  });
}

module.exports = { getFeatured };


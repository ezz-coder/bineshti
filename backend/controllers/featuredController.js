const apartmentModel = require('../models/apartmentModel');
const villaModel = require('../models/villaModel');
const houseModel = require('../models/houseModel');
const landModel = require('../models/landModel');

/**
 * متحكم العناصر المميزة - يجلب العقارات المميزة من جميع الأقسام
 */

// GET /api/featured - العناصر المميزة في الصفحة الرئيسية
async function getFeatured(req, res) {
  const [apartments, villas, houses, lands] = await Promise.all([
    apartmentModel.getAll(),
    villaModel.getAll(),
    houseModel.getAll(),
    landModel.getAll(),
  ]);
  const featuredApartments = apartments.filter((a) => a.isFeatured);
  const featuredVillas = villas.filter((v) => v.isFeatured);
  const featuredHouses = houses.filter((h) => h.isFeatured);
  const featuredLands = lands.filter((l) => l.isFeatured);

  res.status(200).json({
    success: true,
    data: {
      apartments: featuredApartments,
      villas: featuredVillas,
      houses: featuredHouses,
      lands: featuredLands,
    },
  });
}

module.exports = { getFeatured };


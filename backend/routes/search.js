const express = require('express');
const { search } = require('../controllers/searchController');

const router = express.Router();

// GET /api/search?q=keyword - البحث الشامل
router.get('/', search);

module.exports = router;

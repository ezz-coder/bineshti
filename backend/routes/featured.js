const express = require('express');
const { getFeatured } = require('../controllers/featuredController');

const router = express.Router();

// GET /api/featured - العناصر المميزة في الصفحة الرئيسية (مع pagination)
router.get('/', getFeatured);

module.exports = router;

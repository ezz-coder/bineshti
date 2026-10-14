const express = require('express');
const { getSettings } = require('../controllers/settingsController');

const router = express.Router();

// GET /api/settings - الإعدادات (رقم التواصل، النبذة، الاسم)
router.get('/', getSettings);

module.exports = router;

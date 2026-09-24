const express = require('express');
const router = express.Router();
const { getVariantsByJewelry } = require('../controllers/variantController');

router.get('/jewelry/:jewelry_id', getVariantsByJewelry);

module.exports = router;
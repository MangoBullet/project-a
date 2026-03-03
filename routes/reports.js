const express = require('express');
const controller = require('../controllers/reportsController');

const router = express.Router();

router.get('/borrow-by-date', controller.borrowByDate);
router.get('/top-equipment', controller.topEquipment);

module.exports = router;

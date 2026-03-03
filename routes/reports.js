const express = require('express');
const controller = require('../controllers/reportsController');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/borrow-by-date', controller.borrowByDate);
router.get('/top-equipment', controller.topEquipment);

module.exports = router;

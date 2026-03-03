const express = require('express');
const controller = require('../controllers/borrowDetailsController');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', controller.index);
router.get('/new', requireAdmin, controller.createForm);
router.post('/', requireAdmin, controller.create);
router.get('/:id', controller.show);
router.get('/:id/edit', requireAdmin, controller.editForm);
router.put('/:id', requireAdmin, controller.update);
router.delete('/:id', requireAdmin, controller.destroy);

module.exports = router;

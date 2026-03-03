const express = require('express');
const controller = require('../controllers/borrowsController');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', controller.index);
router.get('/new', controller.createForm);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.get('/:id/edit', requireAdmin, controller.editForm);
router.put('/:id', requireAdmin, controller.update);
router.delete('/:id', requireAdmin, controller.destroy);

module.exports = router;

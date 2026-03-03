const express = require('express');
const controller = require('../controllers/usersController');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', requireAdmin, controller.index);
router.get('/new', requireAdmin, controller.createForm);
router.post('/', requireAdmin, controller.create);
router.get('/:id', controller.show);
router.get('/:id/edit', controller.editForm);
router.put('/:id', controller.update);
router.delete('/:id', requireAdmin, controller.destroy);

module.exports = router;

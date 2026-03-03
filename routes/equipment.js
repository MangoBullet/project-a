const express = require('express');
const controller = require('../controllers/equipmentController');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', controller.index);
router.get('/new', controller.createForm);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.get('/:id/edit', controller.editForm);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;

const express = require('express');
const controller = require('../controllers/borrowDetailsController');

const router = express.Router();

router.get('/', controller.index);
router.get('/new', controller.createForm);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.get('/:id/edit', controller.editForm);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;

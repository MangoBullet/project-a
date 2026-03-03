const { Equipment } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const equipment = await Equipment.findAll({ order: [['id', 'ASC']] });
    res.render('equipment/index', { title: 'Equipment', equipment });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) {
      req.flash('error', 'Equipment not found.');
      return res.redirect('/equipment');
    }
    res.render('equipment/show', { title: 'Equipment Detail', item });
  } catch (error) {
    next(error);
  }
};

exports.createForm = (req, res) => {
  res.render('equipment/new', { title: 'Create Equipment', item: {} });
};

exports.create = async (req, res, next) => {
  try {
    const { equipment_name, category, quantity, status } = req.body;
    await Equipment.create({
      equipment_name,
      category,
      quantity: Number(quantity) || 0,
      status: status || 'available'
    });
    req.flash('success', 'Equipment created successfully.');
    res.redirect('/equipment');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/equipment/new');
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) {
      req.flash('error', 'Equipment not found.');
      return res.redirect('/equipment');
    }
    res.render('equipment/edit', { title: 'Edit Equipment', item });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) {
      req.flash('error', 'Equipment not found.');
      return res.redirect('/equipment');
    }

    const { equipment_name, category, quantity, status } = req.body;
    await item.update({
      equipment_name,
      category,
      quantity: Number(quantity) || 0,
      status
    });

    req.flash('success', 'Equipment updated successfully.');
    res.redirect('/equipment');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/equipment/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) {
      req.flash('error', 'Equipment not found.');
      return res.redirect('/equipment');
    }

    await item.destroy();
    req.flash('success', 'Equipment deleted successfully.');
    res.redirect('/equipment');
  } catch (error) {
    req.flash('error', 'Cannot delete equipment. Related borrow details may exist.');
    res.redirect('/equipment');
  }
};

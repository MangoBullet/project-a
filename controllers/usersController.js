const { User } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.render('users/index', { title: 'Users', users });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }
    res.render('users/show', { title: 'User Detail', user });
  } catch (error) {
    next(error);
  }
};

exports.createForm = (req, res) => {
  res.render('users/new', { title: 'Create User', user: {} });
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, student_id, phone } = req.body;
    await User.create({ full_name, student_id, phone });
    req.flash('success', 'User created successfully.');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/users/new');
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }
    res.render('users/edit', { title: 'Edit User', user });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    const { full_name, student_id, phone } = req.body;
    await user.update({ full_name, student_id, phone });
    req.flash('success', 'User updated successfully.');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/users/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    await user.destroy();
    req.flash('success', 'User deleted successfully.');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', 'Cannot delete user. Related borrow records may exist.');
    res.redirect('/users');
  }
};

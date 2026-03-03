const { User } = require('../models');
const { hashPassword } = require('../utils/password');

function isAdmin(req) {
  return req.currentUser && req.currentUser.role === 'admin';
}

exports.index = async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.redirect(`/users/${req.currentUser.id}`);
    }
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.render('users/index', { title: 'Users', users });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    if (!isAdmin(req) && Number(req.params.id) !== req.currentUser.id) {
      req.flash('error', 'Access denied.');
      return res.redirect(`/users/${req.currentUser.id}`);
    }

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
    const { full_name, student_id, phone, username, password, role } = req.body;

    if (!password) {
      req.flash('error', 'Password is required.');
      return res.redirect('/users/new');
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      req.flash('error', 'Username is already in use.');
      return res.redirect('/users/new');
    }

    await User.create({
      full_name,
      student_id,
      phone,
      username,
      password_hash: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user'
    });
    req.flash('success', 'User created successfully.');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/users/new');
  }
};

exports.editForm = async (req, res, next) => {
  try {
    if (!isAdmin(req) && Number(req.params.id) !== req.currentUser.id) {
      req.flash('error', 'Access denied.');
      return res.redirect(`/users/${req.currentUser.id}`);
    }

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
    if (!isAdmin(req) && Number(req.params.id) !== req.currentUser.id) {
      req.flash('error', 'Access denied.');
      return res.redirect(`/users/${req.currentUser.id}`);
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    const { full_name, student_id, phone, username, password, role } = req.body;

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername && existingUsername.id !== user.id) {
      req.flash('error', 'Username is already in use.');
      return res.redirect(`/users/${req.params.id}/edit`);
    }

    const updatePayload = {
      full_name,
      student_id,
      phone,
      username
    };

    if (isAdmin(req)) {
      updatePayload.role = role === 'admin' ? 'admin' : 'user';
    }

    if (password) {
      updatePayload.password_hash = hashPassword(password);
    }

    await user.update(updatePayload);
    req.flash('success', 'User updated successfully.');
    res.redirect(isAdmin(req) ? '/users' : `/users/${user.id}`);
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/users/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      req.flash('error', 'Access denied.');
      return res.redirect(`/users/${req.currentUser.id}`);
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    if (user.id === req.currentUser.id) {
      req.flash('error', 'You cannot delete your own admin account.');
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

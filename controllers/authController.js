const { User } = require('../models');
const { verifyPassword, hashPassword } = require('../utils/password');

exports.loginForm = (req, res) => {
  if (req.currentUser) {
    return res.redirect('/');
  }
  return res.render('auth/login', { title: 'Login' });
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user || !verifyPassword(password || '', user.password_hash)) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id
    };

    req.flash('success', `Welcome, ${user.full_name}.`);
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
};

exports.registerForm = (req, res) => {
  if (req.currentUser) {
    return res.redirect('/');
  }
  return res.render('auth/register', { title: 'Register' });
};

exports.register = async (req, res, next) => {
  try {
    const {
      username,
      password,
      confirm_password,
      full_name,
      student_id,
      phone
    } = req.body;

    if (password !== confirm_password) {
      req.flash('error', 'Password confirmation does not match.');
      return res.redirect('/register');
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      req.flash('error', 'Username is already in use.');
      return res.redirect('/register');
    }

    const existingStudentId = await User.findOne({ where: { student_id } });
    if (existingStudentId) {
      req.flash('error', 'Student ID is already in use.');
      return res.redirect('/register');
    }

    await User.create({
      username,
      password_hash: hashPassword(password),
      full_name,
      student_id,
      phone,
      role: 'user'
    });

    req.flash('success', 'Registration successful. Please login.');
    return res.redirect('/login');
  } catch (error) {
    req.flash('error', error.message);
    return res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

const { User } = require('../models');

async function attachCurrentUser(req, res, next) {
  try {
    const sessionUser = req.session.user || null;
    if (!sessionUser) {
      res.locals.currentUser = null;
      return next();
    }

    const user = await User.findByPk(sessionUser.id);
    if (!user) {
      req.session.destroy(() => {});
      res.locals.currentUser = null;
      return next();
    }

    req.currentUser = user;
    res.locals.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    req.flash('error', 'Please login first.');
    return res.redirect('/login');
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    req.flash('error', 'Access denied.');
    return res.redirect('/');
  }
  return next();
}

module.exports = {
  attachCurrentUser,
  requireAuth,
  requireAdmin
};

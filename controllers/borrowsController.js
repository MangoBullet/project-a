const { Borrow, User, BorrowDetail, Equipment } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const borrows = await Borrow.findAll({
      include: [{ model: User }],
      order: [['id', 'DESC']]
    });
    res.render('borrows/index', { title: 'Borrow Records', borrows });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [
        { model: User },
        {
          model: BorrowDetail,
          include: [{ model: Equipment }]
        }
      ]
    });

    if (!borrow) {
      req.flash('error', 'Borrow record not found.');
      return res.redirect('/borrows');
    }

    res.render('borrows/show', { title: 'Borrow Detail', borrow });
  } catch (error) {
    next(error);
  }
};

exports.createForm = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['full_name', 'ASC']] });
    res.render('borrows/new', {
      title: 'Create Borrow Record',
      borrow: {},
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { user_id, borrow_date, due_date, borrow_status } = req.body;

    if (due_date < borrow_date) {
      req.flash('error', 'Due date must be on or after borrow date.');
      return res.redirect('/borrows/new');
    }

    await Borrow.create({ user_id, borrow_date, due_date, borrow_status });
    req.flash('success', 'Borrow record created successfully.');
    res.redirect('/borrows');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrows/new');
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [borrow, users] = await Promise.all([
      Borrow.findByPk(req.params.id),
      User.findAll({ order: [['full_name', 'ASC']] })
    ]);

    if (!borrow) {
      req.flash('error', 'Borrow record not found.');
      return res.redirect('/borrows');
    }

    res.render('borrows/edit', {
      title: 'Edit Borrow Record',
      borrow,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id);
    if (!borrow) {
      req.flash('error', 'Borrow record not found.');
      return res.redirect('/borrows');
    }

    const { user_id, borrow_date, due_date, borrow_status } = req.body;
    if (due_date < borrow_date) {
      req.flash('error', 'Due date must be on or after borrow date.');
      return res.redirect(`/borrows/${req.params.id}/edit`);
    }

    await borrow.update({ user_id, borrow_date, due_date, borrow_status });
    req.flash('success', 'Borrow record updated successfully.');
    res.redirect('/borrows');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/borrows/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id);
    if (!borrow) {
      req.flash('error', 'Borrow record not found.');
      return res.redirect('/borrows');
    }

    await borrow.destroy();
    req.flash('success', 'Borrow record deleted successfully.');
    res.redirect('/borrows');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrows');
  }
};

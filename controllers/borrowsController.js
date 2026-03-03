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

    const userIds = Array.isArray(user_id) ? user_id : [user_id];
    const borrowDates = Array.isArray(borrow_date) ? borrow_date : [borrow_date];
    const dueDates = Array.isArray(due_date) ? due_date : [due_date];
    const statuses = Array.isArray(borrow_status) ? borrow_status : [borrow_status];

    const payload = userIds
      .map((id, index) => ({
        user_id: Number(id) || null,
        borrow_date: borrowDates[index],
        due_date: dueDates[index],
        borrow_status: statuses[index] || 'borrowed'
      }))
      .filter((item) => item.user_id && item.borrow_date && item.due_date);

    if (!payload.length) {
      throw new Error('Please provide at least one valid borrow record.');
    }

    const invalidDateRange = payload.some((item) => item.due_date < item.borrow_date);
    if (invalidDateRange) {
      req.flash('error', 'Due date must be on or after borrow date for every row.');
      return res.redirect('/borrows/new');
    }

    if (payload.length === 1) {
      await Borrow.create(payload[0]);
    } else {
      await Borrow.bulkCreate(payload);
    }

    req.flash('success', `${payload.length} borrow record(s) created successfully.`);
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

const { BorrowDetail, Borrow, Equipment, User } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const details = await BorrowDetail.findAll({
      include: [
        {
          model: Borrow,
          include: [{ model: User }]
        },
        { model: Equipment }
      ],
      order: [['id', 'DESC']]
    });

    res.render('borrowDetails/index', {
      title: 'Borrow Details',
      details
    });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const detail = await BorrowDetail.findByPk(req.params.id, {
      include: [
        {
          model: Borrow,
          include: [{ model: User }]
        },
        { model: Equipment }
      ]
    });

    if (!detail) {
      req.flash('error', 'Borrow detail not found.');
      return res.redirect('/borrow-details');
    }

    res.render('borrowDetails/show', { title: 'Borrow Detail Item', detail });
  } catch (error) {
    next(error);
  }
};

exports.createForm = async (req, res, next) => {
  try {
    const [borrows, equipment] = await Promise.all([
      Borrow.findAll({
        include: [{ model: User }],
        order: [['id', 'DESC']]
      }),
      Equipment.findAll({ order: [['equipment_name', 'ASC']] })
    ]);

    res.render('borrowDetails/new', {
      title: 'Create Borrow Detail',
      detail: {},
      borrows,
      equipment
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { borrow_id, equipment_id, amount, returned_amount } = req.body;

    if (Number(returned_amount || 0) > Number(amount)) {
      req.flash('error', 'Returned amount cannot exceed borrowed amount.');
      return res.redirect('/borrow-details/new');
    }

    await BorrowDetail.create({
      borrow_id,
      equipment_id,
      amount: Number(amount),
      returned_amount: Number(returned_amount || 0)
    });

    req.flash('success', 'Borrow detail created successfully.');
    res.redirect('/borrow-details');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrow-details/new');
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [detail, borrows, equipment] = await Promise.all([
      BorrowDetail.findByPk(req.params.id),
      Borrow.findAll({
        include: [{ model: User }],
        order: [['id', 'DESC']]
      }),
      Equipment.findAll({ order: [['equipment_name', 'ASC']] })
    ]);

    if (!detail) {
      req.flash('error', 'Borrow detail not found.');
      return res.redirect('/borrow-details');
    }

    res.render('borrowDetails/edit', {
      title: 'Edit Borrow Detail',
      detail,
      borrows,
      equipment
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const detail = await BorrowDetail.findByPk(req.params.id);

    if (!detail) {
      req.flash('error', 'Borrow detail not found.');
      return res.redirect('/borrow-details');
    }

    const { borrow_id, equipment_id, amount, returned_amount } = req.body;

    if (Number(returned_amount || 0) > Number(amount)) {
      req.flash('error', 'Returned amount cannot exceed borrowed amount.');
      return res.redirect(`/borrow-details/${req.params.id}/edit`);
    }

    await detail.update({
      borrow_id,
      equipment_id,
      amount: Number(amount),
      returned_amount: Number(returned_amount || 0)
    });

    req.flash('success', 'Borrow detail updated successfully.');
    res.redirect('/borrow-details');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/borrow-details/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const detail = await BorrowDetail.findByPk(req.params.id);

    if (!detail) {
      req.flash('error', 'Borrow detail not found.');
      return res.redirect('/borrow-details');
    }

    await detail.destroy();
    req.flash('success', 'Borrow detail deleted successfully.');
    res.redirect('/borrow-details');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrow-details');
  }
};

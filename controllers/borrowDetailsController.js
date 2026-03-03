const { sequelize, BorrowDetail, Borrow, Equipment, User } = require('../models');

function nextEquipmentStatus(currentStatus, quantity) {
  if (currentStatus === 'maintenance') {
    return 'maintenance';
  }
  return quantity > 0 ? 'available' : 'borrowed';
}

exports.index = async (req, res, next) => {
  try {
    const borrowInclude = {
      model: Borrow,
      include: [{ model: User }]
    };

    if (req.currentUser.role !== 'admin') {
      borrowInclude.where = { user_id: req.currentUser.id };
      borrowInclude.required = true;
    }

    const details = await BorrowDetail.findAll({
      include: [
        borrowInclude,
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
    const borrowInclude = {
      model: Borrow,
      include: [{ model: User }]
    };

    if (req.currentUser.role !== 'admin') {
      borrowInclude.where = { user_id: req.currentUser.id };
      borrowInclude.required = true;
    }

    const detail = await BorrowDetail.findOne({
      where: { id: req.params.id },
      include: [
        borrowInclude,
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
    const amountNumber = Number(amount);
    const returnedNumber = Number(returned_amount || 0);

    if (amountNumber < 1) {
      req.flash('error', 'Amount must be at least 1.');
      return res.redirect('/borrow-details/new');
    }

    if (returnedNumber > amountNumber) {
      req.flash('error', 'Returned amount cannot exceed borrowed amount.');
      return res.redirect('/borrow-details/new');
    }

    const outstanding = amountNumber - returnedNumber;

    await sequelize.transaction(async (transaction) => {
      const equipmentItem = await Equipment.findByPk(equipment_id, { transaction });
      if (!equipmentItem) {
        throw new Error('Equipment not found.');
      }

      if (Number(equipmentItem.quantity) < outstanding) {
        throw new Error(`Not enough stock for ${equipmentItem.equipment_name}.`);
      }

      await BorrowDetail.create({
        borrow_id,
        equipment_id,
        amount: amountNumber,
        returned_amount: returnedNumber
      }, { transaction });

      const newQuantity = Number(equipmentItem.quantity) - outstanding;
      await equipmentItem.update(
        {
          quantity: newQuantity,
          status: nextEquipmentStatus(equipmentItem.status, newQuantity)
        },
        { transaction }
      );
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
    const newAmount = Number(amount);
    const newReturned = Number(returned_amount || 0);

    if (newAmount < 1) {
      req.flash('error', 'Amount must be at least 1.');
      return res.redirect(`/borrow-details/${req.params.id}/edit`);
    }

    if (newReturned > newAmount) {
      req.flash('error', 'Returned amount cannot exceed borrowed amount.');
      return res.redirect(`/borrow-details/${req.params.id}/edit`);
    }

    await sequelize.transaction(async (transaction) => {
      const oldEquipmentId = Number(detail.equipment_id);
      const newEquipmentId = Number(equipment_id);
      const oldOutstanding = Number(detail.amount) - Number(detail.returned_amount || 0);
      const newOutstanding = newAmount - newReturned;

      if (oldEquipmentId === newEquipmentId) {
        const equipmentItem = await Equipment.findByPk(oldEquipmentId, { transaction });
        if (!equipmentItem) {
          throw new Error('Equipment not found.');
        }

        const quantityDelta = oldOutstanding - newOutstanding;
        const nextQuantity = Number(equipmentItem.quantity) + quantityDelta;
        if (nextQuantity < 0) {
          throw new Error(`Not enough stock for ${equipmentItem.equipment_name}.`);
        }

        await equipmentItem.update(
          {
            quantity: nextQuantity,
            status: nextEquipmentStatus(equipmentItem.status, nextQuantity)
          },
          { transaction }
        );
      } else {
        const [oldEquipment, newEquipment] = await Promise.all([
          Equipment.findByPk(oldEquipmentId, { transaction }),
          Equipment.findByPk(newEquipmentId, { transaction })
        ]);

        if (!oldEquipment || !newEquipment) {
          throw new Error('Equipment not found.');
        }

        if (Number(newEquipment.quantity) < newOutstanding) {
          throw new Error(`Not enough stock for ${newEquipment.equipment_name}.`);
        }

        const restoredOldQuantity = Number(oldEquipment.quantity) + oldOutstanding;
        await oldEquipment.update(
          {
            quantity: restoredOldQuantity,
            status: nextEquipmentStatus(oldEquipment.status, restoredOldQuantity)
          },
          { transaction }
        );

        const reducedNewQuantity = Number(newEquipment.quantity) - newOutstanding;
        await newEquipment.update(
          {
            quantity: reducedNewQuantity,
            status: nextEquipmentStatus(newEquipment.status, reducedNewQuantity)
          },
          { transaction }
        );
      }

      await detail.update({
        borrow_id,
        equipment_id: newEquipmentId,
        amount: newAmount,
        returned_amount: newReturned
      }, { transaction });
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

    await sequelize.transaction(async (transaction) => {
      const equipmentItem = await Equipment.findByPk(detail.equipment_id, { transaction });
      if (!equipmentItem) {
        throw new Error('Equipment not found.');
      }

      const outstanding = Number(detail.amount) - Number(detail.returned_amount || 0);
      const newQuantity = Number(equipmentItem.quantity) + Math.max(0, outstanding);
      await equipmentItem.update(
        {
          quantity: newQuantity,
          status: nextEquipmentStatus(equipmentItem.status, newQuantity)
        },
        { transaction }
      );

      await detail.destroy({ transaction });
    });

    req.flash('success', 'Borrow detail deleted successfully.');
    res.redirect('/borrow-details');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrow-details');
  }
};

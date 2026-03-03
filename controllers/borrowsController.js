const { sequelize, Borrow, User, BorrowDetail, Equipment } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const where = {};
    if (req.currentUser.role !== 'admin') {
      where.user_id = req.currentUser.id;
    }

    const borrows = await Borrow.findAll({
      where,
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
    const where = { id: req.params.id };
    if (req.currentUser.role !== 'admin') {
      where.user_id = req.currentUser.id;
    }

    const borrow = await Borrow.findOne({
      where,
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
    const usersPromise =
      req.currentUser.role === 'admin'
        ? User.findAll({ order: [['full_name', 'ASC']] })
        : Promise.resolve([]);
    const equipmentPromise = Equipment.findAll({ order: [['equipment_name', 'ASC']] });
    const [users, equipment] = await Promise.all([usersPromise, equipmentPromise]);
    const visibleEquipment =
      req.currentUser.role === 'admin'
        ? equipment
        : equipment.filter((item) => Number(item.quantity) > 0);

    res.render('borrows/new', {
      title: 'Create Borrow Record',
      borrow: {},
      users,
      equipment: visibleEquipment
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (req.currentUser.role !== 'admin') {
      const { borrow_date, due_date, equipment_id, amount } = req.body;

      if (!borrow_date || !due_date) {
        req.flash('error', 'Borrow date and due date are required.');
        return res.redirect('/borrows/new');
      }

      if (due_date < borrow_date) {
        req.flash('error', 'Due date must be on or after borrow date.');
        return res.redirect('/borrows/new');
      }

      const equipmentIds = Array.isArray(equipment_id) ? equipment_id : [equipment_id];
      const amounts = Array.isArray(amount) ? amount : [amount];
      const detailPayload = equipmentIds
        .map((id, index) => ({
          equipment_id: Number(id) || null,
          amount: Math.max(1, Number(amounts[index]) || 0),
          returned_amount: 0
        }))
        .filter((item) => item.equipment_id && item.amount > 0);

      if (!detailPayload.length) {
        req.flash('error', 'Please add at least one equipment item.');
        return res.redirect('/borrows/new');
      }

      await sequelize.transaction(async (transaction) => {
        const requiredByEquipment = detailPayload.reduce((acc, item) => {
          acc[item.equipment_id] = (acc[item.equipment_id] || 0) + item.amount;
          return acc;
        }, {});

        const equipmentIdsUnique = Object.keys(requiredByEquipment).map((id) => Number(id));
        const equipmentRows = await Equipment.findAll({
          where: { id: equipmentIdsUnique },
          transaction
        });

        if (equipmentRows.length !== equipmentIdsUnique.length) {
          throw new Error('Some selected equipment was not found.');
        }

        for (const equipmentItem of equipmentRows) {
          const requiredAmount = requiredByEquipment[equipmentItem.id] || 0;
          if (Number(equipmentItem.quantity) < requiredAmount) {
            throw new Error(`Not enough stock for ${equipmentItem.equipment_name}.`);
          }
        }

        const borrow = await Borrow.create(
          {
            user_id: req.currentUser.id,
            borrow_date,
            due_date,
            borrow_status: 'borrowed'
          },
          { transaction }
        );

        await BorrowDetail.bulkCreate(
          detailPayload.map((item) => ({
            borrow_id: borrow.id,
            equipment_id: item.equipment_id,
            amount: item.amount,
            returned_amount: 0
          })),
          { transaction }
        );

        for (const equipmentItem of equipmentRows) {
          const requiredAmount = requiredByEquipment[equipmentItem.id] || 0;
          const newQuantity = Number(equipmentItem.quantity) - requiredAmount;
          const nextStatus =
            equipmentItem.status === 'maintenance'
              ? 'maintenance'
              : newQuantity > 0
                ? 'available'
                : 'borrowed';

          await equipmentItem.update(
            {
              quantity: newQuantity,
              status: nextStatus
            },
            { transaction }
          );
        }
      });

      req.flash('success', 'Borrow request created successfully.');
      return res.redirect('/borrows');
    }

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
    return res.redirect('/borrows');
  } catch (error) {
    req.flash('error', error.message);
    return res.redirect('/borrows/new');
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
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: BorrowDetail }]
    });
    if (!borrow) {
      req.flash('error', 'Borrow record not found.');
      return res.redirect('/borrows');
    }

    await sequelize.transaction(async (transaction) => {
      const outstandingByEquipment = borrow.BorrowDetails.reduce((acc, detail) => {
        const outstanding = Number(detail.amount) - Number(detail.returned_amount || 0);
        if (outstanding > 0) {
          acc[detail.equipment_id] = (acc[detail.equipment_id] || 0) + outstanding;
        }
        return acc;
      }, {});

      const equipmentIds = Object.keys(outstandingByEquipment).map((id) => Number(id));
      if (equipmentIds.length) {
        const equipmentRows = await Equipment.findAll({
          where: { id: equipmentIds },
          transaction
        });

        for (const item of equipmentRows) {
          const returnedStock = outstandingByEquipment[item.id] || 0;
          const newQuantity = Number(item.quantity) + returnedStock;
          const nextStatus =
            item.status === 'maintenance'
              ? 'maintenance'
              : newQuantity > 0
                ? 'available'
                : 'borrowed';

          await item.update(
            {
              quantity: newQuantity,
              status: nextStatus
            },
            { transaction }
          );
        }
      }

      await BorrowDetail.destroy({
        where: { borrow_id: borrow.id },
        transaction
      });
      await borrow.destroy({ transaction });
    });

    req.flash('success', 'Borrow record deleted successfully.');
    res.redirect('/borrows');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/borrows');
  }
};

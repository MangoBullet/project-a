const { Op, fn, col } = require('sequelize');
const { Borrow, BorrowDetail, Equipment, User } = require('../models');

exports.borrowByDate = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.borrow_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.borrow_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.borrow_date = { [Op.lte]: endDate };
    }

    const borrows = await Borrow.findAll({
      where,
      include: [
        { model: User },
        {
          model: BorrowDetail,
          include: [{ model: Equipment }]
        }
      ],
      order: [['borrow_date', 'DESC'], ['id', 'DESC']]
    });

    const borrowRows = borrows.map((borrow) => {
      const totalItemsBorrowed = borrow.BorrowDetails.reduce(
        (acc, detail) => acc + detail.amount,
        0
      );

      return {
        id: borrow.id,
        userName: borrow.User ? borrow.User.full_name : 'Unknown',
        borrowDate: borrow.borrow_date,
        dueDate: borrow.due_date,
        status: borrow.borrow_status,
        totalItemsBorrowed
      };
    });

    const totalItemsBorrowedAll = borrowRows.reduce(
      (acc, row) => acc + row.totalItemsBorrowed,
      0
    );

    res.render('reports/borrowByDate', {
      title: 'Borrow Report by Date',
      borrowRows,
      totalRecords: borrowRows.length,
      totalItemsBorrowedAll,
      filters: { startDate: startDate || '', endDate: endDate || '' }
    });
  } catch (error) {
    next(error);
  }
};

exports.topEquipment = async (req, res, next) => {
  try {
    const rows = await BorrowDetail.findAll({
      attributes: [
        'equipment_id',
        [fn('COUNT', col('BorrowDetail.id')), 'totalTimesBorrowed'],
        [fn('SUM', col('amount')), 'totalQuantityBorrowed']
      ],
      include: [{ model: Equipment, attributes: ['equipment_name'] }],
      group: ['equipment_id', 'Equipment.id'],
      order: [[fn('SUM', col('amount')), 'DESC']]
    });

    const reportRows = rows.map((row) => ({
      equipmentName: row.Equipment ? row.Equipment.equipment_name : 'Unknown',
      totalTimesBorrowed: Number(row.get('totalTimesBorrowed')),
      totalQuantityBorrowed: Number(row.get('totalQuantityBorrowed'))
    }));

    const totals = reportRows.reduce(
      (acc, row) => {
        acc.totalTimesBorrowed += row.totalTimesBorrowed;
        acc.totalQuantityBorrowed += row.totalQuantityBorrowed;
        return acc;
      },
      { totalTimesBorrowed: 0, totalQuantityBorrowed: 0 }
    );

    res.render('reports/topEquipment', {
      title: 'Most Borrowed Equipment',
      reportRows,
      totals
    });
  } catch (error) {
    next(error);
  }
};

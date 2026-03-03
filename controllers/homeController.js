const { User, Equipment, Borrow, BorrowDetail } = require('../models');

exports.dashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalEquipment, activeBorrows] = await Promise.all([
      User.count(),
      Equipment.count(),
      Borrow.count({ where: { borrow_status: 'borrowed' } })
    ]);

    const recentlyBorrowedItems = await Borrow.findAll({
      include: [
        { model: User },
        {
          model: BorrowDetail,
          include: [{ model: Equipment }]
        }
      ],
      order: [['borrow_date', 'DESC'], ['id', 'DESC']],
      limit: 5
    });

    res.render('home/index', {
      title: 'Dashboard',
      stats: { totalUsers, totalEquipment, activeBorrows },
      recentlyBorrowedItems
    });
  } catch (error) {
    next(error);
  }
};

const { User, Equipment, Borrow, BorrowDetail } = require('../models');

exports.dashboard = async (req, res, next) => {
  try {
    let stats;
    let recentlyBorrowedItems;

    if (req.currentUser.role === 'admin') {
      const [totalUsers, totalEquipment, activeBorrows] = await Promise.all([
        User.count(),
        Equipment.count(),
        Borrow.count({ where: { borrow_status: 'borrowed' } })
      ]);
      stats = { totalUsers, totalEquipment, activeBorrows };

      recentlyBorrowedItems = await Borrow.findAll({
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
    } else {
      const [activeBorrows, ownDetails] = await Promise.all([
        Borrow.count({
          where: {
            user_id: req.currentUser.id,
            borrow_status: 'borrowed'
          }
        }),
        BorrowDetail.findAll({
          include: [
            {
              model: Borrow,
              where: { user_id: req.currentUser.id },
              attributes: []
            }
          ],
          attributes: ['equipment_id']
        })
      ]);

      const ownEquipmentCount = new Set(
        ownDetails.map((detail) => detail.equipment_id)
      ).size;
      stats = { totalUsers: 1, totalEquipment: ownEquipmentCount, activeBorrows };

      recentlyBorrowedItems = await Borrow.findAll({
        where: { user_id: req.currentUser.id },
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
    }

    res.render('home/index', {
      title: 'Dashboard',
      stats,
      recentlyBorrowedItems
    });
  } catch (error) {
    next(error);
  }
};

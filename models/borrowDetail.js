module.exports = (sequelize, DataTypes) => {
  const BorrowDetail = sequelize.define(
    'BorrowDetail',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      borrow_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'borrows',
          key: 'id'
        }
      },
      equipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id'
        }
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
      },
      returned_amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 }
      }
    },
    {
      tableName: 'borrow_details',
      underscored: true
    }
  );

  return BorrowDetail;
};

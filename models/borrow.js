module.exports = (sequelize, DataTypes) => {
  const Borrow = sequelize.define(
    'Borrow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      borrow_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      borrow_status: {
        type: DataTypes.STRING,
        defaultValue: 'borrowed'
      }
    },
    {
      tableName: 'borrows',
      underscored: true
    }
  );

  return Borrow;
};

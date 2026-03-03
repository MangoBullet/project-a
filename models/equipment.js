module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define(
    'Equipment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      equipment_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'available'
      }
    },
    {
      tableName: 'equipment',
      underscored: true
    }
  );

  return Equipment;
};

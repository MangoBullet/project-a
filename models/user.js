module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      student_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { notEmpty: true }
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { notEmpty: true }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { notEmpty: true }
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
          isIn: [['admin', 'user']]
        }
      }
    },
    {
      tableName: 'users',
      underscored: true
    }
  );

  return User;
};

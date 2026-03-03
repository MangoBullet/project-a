const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database', 'database.sqlite'),
  logging: false
});

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, DataTypes);
db.Equipment = require('./equipment')(sequelize, DataTypes);
db.Borrow = require('./borrow')(sequelize, DataTypes);
db.BorrowDetail = require('./borrowDetail')(sequelize, DataTypes);

// Associations
// User 1:N Borrow
db.User.hasMany(db.Borrow, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Borrow.belongsTo(db.User, { foreignKey: 'user_id' });

// Borrow 1:N BorrowDetail
db.Borrow.hasMany(db.BorrowDetail, { foreignKey: 'borrow_id', onDelete: 'CASCADE' });
db.BorrowDetail.belongsTo(db.Borrow, { foreignKey: 'borrow_id' });

// Equipment 1:N BorrowDetail
db.Equipment.hasMany(db.BorrowDetail, { foreignKey: 'equipment_id', onDelete: 'CASCADE' });
db.BorrowDetail.belongsTo(db.Equipment, { foreignKey: 'equipment_id' });

module.exports = db;

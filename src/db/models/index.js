'use strict';

const { sequelize } = require('../../config/db');
const { DataTypes } = require('sequelize');

// Model factories
const User = require('./user')(sequelize, DataTypes);
const EmailToken = require('./emailToken')(sequelize, DataTypes);
const EmployeeProfile = require('./employeeProfile')(sequelize, DataTypes);
const Document = require('./document')(sequelize, DataTypes);
const Attendance = require('./attendance')(sequelize, DataTypes);
const LeaveBalance = require('./leaveBalance')(sequelize, DataTypes);
const Leave = require('./leave')(sequelize, DataTypes);
const SalarySlip = require('./salarySlip')(sequelize, DataTypes);
const Task = require('./task')(sequelize, DataTypes);
const Tour = require('./tour')(sequelize, DataTypes);
const Advance = require('./advance')(sequelize, DataTypes);
const Notice = require('./notice')(sequelize, DataTypes);
const Notification = require('./notification')(sequelize, DataTypes);
const RefreshToken = require('./refreshToken')(sequelize, DataTypes);

// ── Associations ────────────────────────────────────────
User.hasMany(EmailToken, { foreignKey: 'user_id', as: 'tokens', onDelete: 'CASCADE' });
EmailToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(EmployeeProfile, { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
EmployeeProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const hasManyOwned = (model, alias) => {
  User.hasMany(model, { foreignKey: 'user_id', as: alias, onDelete: 'CASCADE' });
  model.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};
hasManyOwned(Document, 'documents');
hasManyOwned(Attendance, 'attendance');
hasManyOwned(LeaveBalance, 'leaveBalances');
hasManyOwned(Leave, 'leaves');
hasManyOwned(SalarySlip, 'salarySlips');
hasManyOwned(Task, 'tasks');
hasManyOwned(Tour, 'tours');
hasManyOwned(Advance, 'advances');
hasManyOwned(Notification, 'notifications');

const db = {
  sequelize,
  User,
  EmailToken,
  EmployeeProfile,
  Document,
  Attendance,
  LeaveBalance,
  Leave,
  SalarySlip,
  Task,
  Tour,
  Advance,
  Notice,
  Notification,
  RefreshToken,
};

module.exports = db;

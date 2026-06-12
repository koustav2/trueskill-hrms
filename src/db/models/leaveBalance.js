'use strict';

const TYPES = ['CL', 'SL', 'PL', 'ML'];

module.exports = (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define(
    'LeaveBalance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.ENUM(...TYPES), allowNull: false },
      total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'leave_balances',
      underscored: true,
      indexes: [{ unique: true, fields: ['user_id', 'type'] }],
    }
  );
  LeaveBalance.TYPES = TYPES;
  // Default annual allotment used when activating an employee.
  LeaveBalance.DEFAULTS = { CL: 12, SL: 10, PL: 10, ML: 5 };
  return LeaveBalance;
};

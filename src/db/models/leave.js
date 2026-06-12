'use strict';

const TYPES = ['CL', 'SL', 'PL', 'ML'];
const STATUSES = ['APPLIED', 'APPROVED', 'REJECTED'];

module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define(
    'Leave',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.ENUM(...TYPES), allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      remarks: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: DataTypes.UUID, allowNull: true },
      decided_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'leaves', underscored: true }
  );
  Leave.TYPES = TYPES;
  Leave.STATUSES = STATUSES;
  return Leave;
};

'use strict';

const STATUSES = ['APPLIED', 'APPROVED', 'REJECTED'];

module.exports = (sequelize, DataTypes) => {
  const Tour = sequelize.define(
    'Tour',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      place: { type: DataTypes.STRING(160), allowNull: false },
      from_date: { type: DataTypes.DATEONLY, allowNull: false },
      to_date: { type: DataTypes.DATEONLY, allowNull: false },
      purpose: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'tours', underscored: true }
  );
  Tour.STATUSES = STATUSES;
  return Tour;
};

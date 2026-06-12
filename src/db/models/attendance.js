'use strict';

const STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];

module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      check_in: { type: DataTypes.DATE, allowNull: true },
      check_out: { type: DataTypes.DATE, allowNull: true },
      total_minutes: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'PRESENT' },
      selfie_url: { type: DataTypes.STRING(512), allowNull: true },
      check_in_lat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      check_in_lng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      check_out_lat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      check_out_lng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      check_in_address: { type: DataTypes.STRING(512), allowNull: true },
      check_out_address: { type: DataTypes.STRING(512), allowNull: true },
    },
    {
      tableName: 'attendance',
      underscored: true,
      indexes: [{ unique: true, fields: ['user_id', 'date'] }],
    }
  );
  Attendance.STATUSES = STATUSES;
  return Attendance;
};

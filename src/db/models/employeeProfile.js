'use strict';

module.exports = (sequelize, DataTypes) => {
  const EmployeeProfile = sequelize.define(
    'EmployeeProfile',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      full_name: { type: DataTypes.STRING(120), allowNull: false },
      avatar_url: { type: DataTypes.STRING(512), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },
      pincode: { type: DataTypes.STRING(12), allowNull: true },
      department: { type: DataTypes.STRING(80), allowNull: true },
      designation: { type: DataTypes.STRING(80), allowNull: true },
      date_of_joining: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: 'employee_profiles', underscored: true }
  );

  return EmployeeProfile;
};

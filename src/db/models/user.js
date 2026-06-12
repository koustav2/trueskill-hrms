'use strict';

const ROLES = ['EMPLOYEE', 'HR_ADMIN'];
const STATUSES = [
  'PENDING_VERIFY',   // registered, email not verified
  'DOCS_PENDING',     // email verified, documents not submitted
  'DOCS_SUBMITTED',   // documents uploaded, awaiting HR verification
  'ACTIVE',           // verified + employee code issued
  'REJECTED',         // application rejected
];

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'EMPLOYEE' },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'PENDING_VERIFY' },
      employee_code: { type: DataTypes.STRING(20), allowNull: true, unique: true },
      email_verified_at: { type: DataTypes.DATE, allowNull: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users',
      underscored: true,
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      scopes: { withSecret: { attributes: { include: ['password_hash'] } } },
    }
  );

  User.ROLES = ROLES;
  User.STATUSES = STATUSES;
  return User;
};

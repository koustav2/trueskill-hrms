'use strict';

module.exports = (sequelize, DataTypes) => {
  const SalarySlip = sequelize.define(
    'SalarySlip',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      month: { type: DataTypes.INTEGER, allowNull: false }, // 1-12
      year: { type: DataTypes.INTEGER, allowNull: false },
      // Encrypted monetary amounts (AES-256-GCM payloads).
      gross_enc: { type: DataTypes.TEXT, allowNull: false },
      deductions_enc: { type: DataTypes.TEXT, allowNull: false },
      net_enc: { type: DataTypes.TEXT, allowNull: false },
      pdf_url: { type: DataTypes.STRING(512), allowNull: true },
    },
    {
      tableName: 'salary_slips',
      underscored: true,
      indexes: [{ unique: true, fields: ['user_id', 'month', 'year'] }],
    }
  );
  return SalarySlip;
};

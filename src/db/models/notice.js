'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    'Notice',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      audience: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'ALL' },
      created_by: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'notices', underscored: true }
  );
  return Notice;
};

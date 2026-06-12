'use strict';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['NOT_DONE', 'IN_PROGRESS', 'COMPLETED'];

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      priority: { type: DataTypes.ENUM(...PRIORITIES), allowNull: false, defaultValue: 'MEDIUM' },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'NOT_DONE' },
    },
    { tableName: 'tasks', underscored: true }
  );
  Task.PRIORITIES = PRIORITIES;
  Task.STATUSES = STATUSES;
  return Task;
};

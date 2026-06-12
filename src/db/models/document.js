'use strict';

const TYPES = ['AADHAR', 'PAN', 'BANK', 'QUALIFICATION'];
const STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.ENUM(...TYPES), allowNull: false },
      file_url: { type: DataTypes.STRING(512), allowNull: true },
      file_url_back: { type: DataTypes.STRING(512), allowNull: true },
      // Encrypted document number (Aadhar/PAN/bank account) — AES-256-GCM payload.
      number_enc: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'PENDING' },
      verified_by: { type: DataTypes.UUID, allowNull: true },
      remarks: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'documents', underscored: true }
  );
  Document.TYPES = TYPES;
  Document.STATUSES = STATUSES;
  return Document;
};

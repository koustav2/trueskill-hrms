'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = Sequelize;
    const ts = {
      created_at: { type: t.DATE, allowNull: false },
      updated_at: { type: t.DATE, allowNull: false },
    };
    const userFk = {
      type: t.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    };

    await queryInterface.createTable('documents', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      type: { type: t.ENUM('AADHAR', 'PAN', 'BANK', 'QUALIFICATION'), allowNull: false },
      file_url: { type: t.STRING(512), allowNull: true },
      file_url_back: { type: t.STRING(512), allowNull: true },
      number_enc: { type: t.TEXT, allowNull: true },
      status: { type: t.ENUM('PENDING', 'VERIFIED', 'REJECTED'), allowNull: false, defaultValue: 'PENDING' },
      verified_by: { type: t.UUID, allowNull: true },
      remarks: { type: t.STRING(255), allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('attendance', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      date: { type: t.DATEONLY, allowNull: false },
      check_in: { type: t.DATE, allowNull: true },
      check_out: { type: t.DATE, allowNull: true },
      total_minutes: { type: t.INTEGER, allowNull: true },
      status: { type: t.ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'), allowNull: false, defaultValue: 'PRESENT' },
      selfie_url: { type: t.STRING(512), allowNull: true },
      ...ts,
    });
    await queryInterface.addIndex('attendance', ['user_id', 'date'], { unique: true, name: 'attendance_user_date_uq' });

    await queryInterface.createTable('leave_balances', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      type: { type: t.ENUM('CL', 'SL', 'PL', 'ML'), allowNull: false },
      total: { type: t.INTEGER, allowNull: false, defaultValue: 0 },
      used: { type: t.INTEGER, allowNull: false, defaultValue: 0 },
      ...ts,
    });
    await queryInterface.addIndex('leave_balances', ['user_id', 'type'], { unique: true, name: 'leave_balance_user_type_uq' });

    await queryInterface.createTable('leaves', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      type: { type: t.ENUM('CL', 'SL', 'PL', 'ML'), allowNull: false },
      start_date: { type: t.DATEONLY, allowNull: false },
      end_date: { type: t.DATEONLY, allowNull: false },
      days: { type: t.INTEGER, allowNull: false, defaultValue: 1 },
      remarks: { type: t.STRING(255), allowNull: true },
      status: { type: t.ENUM('APPLIED', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: t.UUID, allowNull: true },
      decided_at: { type: t.DATE, allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('salary_slips', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      month: { type: t.INTEGER, allowNull: false },
      year: { type: t.INTEGER, allowNull: false },
      gross_enc: { type: t.TEXT, allowNull: false },
      deductions_enc: { type: t.TEXT, allowNull: false },
      net_enc: { type: t.TEXT, allowNull: false },
      pdf_url: { type: t.STRING(512), allowNull: true },
      ...ts,
    });
    await queryInterface.addIndex('salary_slips', ['user_id', 'month', 'year'], { unique: true, name: 'salary_user_month_year_uq' });

    await queryInterface.createTable('tasks', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      title: { type: t.STRING(200), allowNull: false },
      due_date: { type: t.DATEONLY, allowNull: true },
      priority: { type: t.ENUM('LOW', 'MEDIUM', 'HIGH'), allowNull: false, defaultValue: 'MEDIUM' },
      status: { type: t.ENUM('NOT_DONE', 'IN_PROGRESS', 'COMPLETED'), allowNull: false, defaultValue: 'NOT_DONE' },
      ...ts,
    });

    await queryInterface.createTable('tours', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      place: { type: t.STRING(160), allowNull: false },
      from_date: { type: t.DATEONLY, allowNull: false },
      to_date: { type: t.DATEONLY, allowNull: false },
      purpose: { type: t.STRING(255), allowNull: true },
      status: { type: t.ENUM('APPLIED', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: t.UUID, allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('advances', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      amount_enc: { type: t.TEXT, allowNull: false },
      reason: { type: t.STRING(255), allowNull: true },
      status: { type: t.ENUM('APPLIED', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: t.UUID, allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('notices', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      title: { type: t.STRING(200), allowNull: false },
      body: { type: t.TEXT, allowNull: false },
      audience: { type: t.STRING(40), allowNull: false, defaultValue: 'ALL' },
      created_by: { type: t.UUID, allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('notifications', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: userFk,
      title: { type: t.STRING(200), allowNull: false },
      body: { type: t.TEXT, allowNull: true },
      read_at: { type: t.DATE, allowNull: true },
      ...ts,
    });
  },

  async down(queryInterface) {
    for (const table of [
      'notifications', 'notices', 'advances', 'tours', 'tasks',
      'salary_slips', 'leaves', 'leave_balances', 'attendance', 'documents',
    ]) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.dropTable(table);
    }
  },
};

'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@trueskill.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

    const existing = await queryInterface.rawSelect('users', { where: { email } }, ['id']);
    if (existing) return;

    const now = new Date();
    const userId = uuidv4();
    const hash = await bcrypt.hash(password, 12);

    await queryInterface.bulkInsert('users', [
      {
        id: userId,
        email,
        phone: null,
        password_hash: hash,
        role: 'HR_ADMIN',
        status: 'ACTIVE',
        employee_code: 'EMP1000',
        email_verified_at: now,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('employee_profiles', [
      {
        id: uuidv4(),
        user_id: userId,
        full_name: 'TrueSkill HR Admin',
        avatar_url: null,
        address: null,
        pincode: null,
        department: 'Human Resources',
        designation: 'HR Administrator',
        date_of_joining: now,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@trueskill.com';
    await queryInterface.bulkDelete('users', { email });
  },
};

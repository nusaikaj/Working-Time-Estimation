'use strict';

const bcrypt = require('bcrypt');

// Demo credentials — documented in the README. All accounts share the same
// password so graders can log in immediately: Password@123
const DEMO_PASSWORD = 'Password@123';

module.exports = {
  up: async (queryInterface) => {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        name: 'Priya Sharma',
        email: 'pm@example.com',
        password: hash,
        role: 'PM',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Arjun Mehta',
        email: 'engineer1@example.com',
        password: hash,
        role: 'ENGINEER',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Sara Khan',
        email: 'engineer2@example.com',
        password: hash,
        role: 'ENGINEER',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'David Lee',
        email: 'engineer3@example.com',
        password: hash,
        role: 'ENGINEER',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};

'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    // Look up seeded users by email instead of hardcoding IDs — safer if
    // this seeder ever runs against a database with pre-existing rows.
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN (:emails)`,
      {
        replacements: {
          emails: ['engineer1@example.com', 'engineer2@example.com', 'engineer3@example.com'],
        },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const idFor = (email) => users.find((u) => u.email === email)?.id;

    await queryInterface.bulkInsert('tasks', [
      {
        title: 'Design REST API for billing module',
        description: 'Define resource models, endpoints and error contracts for the new billing service.',
        assignedEngineer: idFor('engineer1@example.com'),
        estimateDays: 5.5,
        startDateTime: new Date('2004-05-24T08:00:00'),
        calculatedEndDateTime: new Date('2004-06-01T12:00:00'),
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Implement working-time calculation engine',
        description: 'Core algorithm that converts a fractional-day estimate into an end date/time.',
        assignedEngineer: idFor('engineer2@example.com'),
        estimateDays: 3.25,
        startDateTime: new Date('2004-05-24T09:00:00'),
        calculatedEndDateTime: null,
        status: 'IN_PROGRESS',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Set up CI pipeline',
        description: 'GitHub Actions workflow to run lint, tests and coverage on every pull request.',
        assignedEngineer: idFor('engineer3@example.com'),
        estimateDays: null,
        startDateTime: null,
        calculatedEndDateTime: null,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Migrate authentication to JWT',
        description: 'Replace legacy session auth with stateless JWT-based authentication.',
        assignedEngineer: idFor('engineer1@example.com'),
        estimateDays: -2.5,
        startDateTime: new Date('2004-05-20T08:00:00'),
        calculatedEndDateTime: new Date('2004-05-17T13:00:00'),
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Unassigned: Write onboarding documentation',
        description: 'Draft the developer onboarding guide for new hires.',
        assignedEngineer: null,
        estimateDays: null,
        startDateTime: null,
        calculatedEndDateTime: null,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('tasks', null, {});
  },
};

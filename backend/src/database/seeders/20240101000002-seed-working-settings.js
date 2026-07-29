'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('working_settings', [
      {
        workingStartTime: '08:00:00',
        workingEndTime: '16:00:00',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('working_settings', null, {});
  },
};

'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('recurring_holidays', [
      // 17 May every year — used in the assignment's worked examples.
      { month: 5, day: 17, createdAt: now, updatedAt: now },
      // 1 January every year — New Year's Day.
      { month: 1, day: 1, createdAt: now, updatedAt: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('recurring_holidays', null, {});
  },
};

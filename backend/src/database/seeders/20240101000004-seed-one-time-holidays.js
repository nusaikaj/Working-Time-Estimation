'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('one_time_holidays', [
      // 27 May 2004 — used in the assignment's worked examples.
      { holidayDate: '2004-05-27', createdAt: now, updatedAt: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('one_time_holidays', null, {});
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recurring_holidays', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      day: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('recurring_holidays', ['month', 'day'], {
      unique: true,
      name: 'recurring_holidays_month_day_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('recurring_holidays');
  },
};

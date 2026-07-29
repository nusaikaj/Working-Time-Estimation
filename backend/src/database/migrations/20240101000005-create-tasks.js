'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assignedEngineer: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estimateDays: {
        type: Sequelize.DECIMAL(12, 7),
        allowNull: true,
      },
      startDateTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      calculatedEndDateTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    await queryInterface.addIndex('tasks', ['assignedEngineer']);
    await queryInterface.addIndex('tasks', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tasks');
  },
};

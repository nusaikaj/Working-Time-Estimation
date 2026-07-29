const { Model, DataTypes } = require('sequelize');

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

module.exports = (sequelize) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, {
        foreignKey: 'assignedEngineer',
        as: 'engineer',
      });
    }
  }

  Task.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: { msg: 'Title is required' } },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      assignedEngineer: {
        // FK -> users.id. Nullable: a PM may create a task before assigning it.
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      // Fractional working-day estimate submitted by the engineer.
      // DECIMAL(12,7) comfortably covers assignment examples like 44.723656
      // and -6.7470217 without floating point drift.
      estimateDays: {
        type: DataTypes.DECIMAL(12, 7),
        allowNull: true,
        get() {
          const raw = this.getDataValue('estimateDays');
          return raw === null ? null : Number(raw);
        },
      },
      startDateTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      calculatedEndDateTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(STATUS)),
        allowNull: false,
        defaultValue: STATUS.PENDING,
      },
    },
    {
      sequelize,
      modelName: 'Task',
      tableName: 'tasks',
    }
  );

  Task.STATUS = STATUS;

  return Task;
};

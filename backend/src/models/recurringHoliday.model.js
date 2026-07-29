const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RecurringHoliday extends Model {}

  RecurringHoliday.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // A holiday that repeats every year on the same month/day, e.g. 17 May.
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 12 },
      },
      day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 31 },
      },
    },
    {
      sequelize,
      modelName: 'RecurringHoliday',
      tableName: 'recurring_holidays',
      indexes: [{ unique: true, fields: ['month', 'day'] }],
    }
  );

  return RecurringHoliday;
};

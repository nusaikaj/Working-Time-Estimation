const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OneTimeHoliday extends Model {}

  OneTimeHoliday.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // A holiday that occurs once on a specific calendar date, e.g. 27 May 2004.
      holidayDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'OneTimeHoliday',
      tableName: 'one_time_holidays',
    }
  );

  return OneTimeHoliday;
};

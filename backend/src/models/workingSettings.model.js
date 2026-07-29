const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WorkingSettings extends Model {}

  WorkingSettings.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // Stored as SQL TIME ('08:00:00'). Sequelize returns these as 'HH:MM:SS' strings.
      workingStartTime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '08:00:00',
      },
      workingEndTime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '16:00:00',
      },
    },
    {
      sequelize,
      modelName: 'WorkingSettings',
      tableName: 'working_settings',
    }
  );

  return WorkingSettings;
};

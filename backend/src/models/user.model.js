const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, {
        foreignKey: 'assignedEngineer',
        as: 'assignedTasks',
      });
    }

    /** Returns the user without the password hash — safe to send to the client. */
    toSafeJSON() {
      const { id, name, email, role, profileImage, createdAt, updatedAt } = this.get();
      return { id, name, email, role, profileImage, createdAt, updatedAt };
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: { msg: 'Name is required' } },
      },
      email: {
        type: DataTypes.STRING(180),
        allowNull: false,
        unique: { msg: 'An account with this email already exists' },
        validate: { isEmail: { msg: 'A valid email is required' } },
      },
      password: {
        // bcrypt hash, never the plaintext password.
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('PM', 'ENGINEER'),
        allowNull: false,
        defaultValue: 'ENGINEER',
      },
      // Relative URL under /uploads (e.g. '/uploads/avatars/3-171...jpg'), or
      // null when the user has no photo — the frontend falls back to initials.
      profileImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    }
  );

  return User;
};

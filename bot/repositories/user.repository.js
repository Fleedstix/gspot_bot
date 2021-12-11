const { DataTypes } = require('sequelize')
const db = require('../db.js')

const GameRepository = require('./game.repository.js')

const UserRepository = db.define('users',
  // Описание таблиц
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    telegram_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    step: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    filters: {
      type: DataTypes.STRING,
      allowNull: true
    },
    search_offset: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    search_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deactive: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  // Опции
  {
    timestamps: false
  }
)

UserRepository.hasMany(GameRepository, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'games' })
GameRepository.belongsTo(UserRepository, { foreignKey: 'user_id', sourceKey: 'user_id' })

module.exports = UserRepository

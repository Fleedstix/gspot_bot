const { DataTypes } = require('sequelize')
const db = require('../db.js')

const GameRepository = db.define('games',
  // Описание таблиц
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    game_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
    rank_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  // Опции
  {
    timestamps: false
  }
)

module.exports = GameRepository

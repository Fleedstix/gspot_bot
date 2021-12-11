const { DataTypes } = require('sequelize')
const db = require('../db.js')

const LikeRepository = db.define('likes',
  // Описание таблиц
  {
    like_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    liked_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  // Опции
  {
    timestamps: false
  }
)

module.exports = LikeRepository

const Sequilize = require('sequelize')
const { DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_HOST } = require('./config')

module.exports = new Sequilize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST || 'localhost',
  dialect: 'mysql',
  operatorsAliases: 0,
  pool: {
    max: 5,
    min: 0,
    acquire: 3000,
    idle: 10000
  }
})
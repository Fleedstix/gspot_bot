const TelegramBot = require('node-telegram-bot-api')
const Controller = require('./controller')
const { BOT_TOKEN } = require('./config')

const bot = new TelegramBot(BOT_TOKEN, {polling: true});

bot.on('callback_query', (msg) => Controller.handle(bot, msg, 'callback'))
bot.on('message', (msg) => Controller.handle(bot, msg, 'message'))
bot.on('inline_query', (msg) => Controller.handle(bot, msg, 'inline'))

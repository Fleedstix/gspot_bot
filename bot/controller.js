const UserService = require('./services/user.service.js') // Сервисы
const keyboards = require('./helpers/keyboards.js') // Клавиатуры
const { games, getGamesList, getRankId } = require('./helpers/games') // Список игр
const { WHITELIST, WHITELIST_USERS } = require('./config') // Конфиг вайтлиста
const utils = require('./helpers/utilities') // Утилити
const fs = require('fs')

const sendMessage = (bot, telegram_id, message, options = null) => {
    return new Promise(function(resolve, reject) {
        if (options) {
            bot.sendMessage(telegram_id, message, options).then((res) => {
                resolve(res)
            }).catch((err) => {
                UserService.updateUser(telegram_id, { deactive: 1 })
                resolve(false)
            })
        } else {
            bot.sendMessage(telegram_id, message).then((res) => {
                resolve(res)
            }).catch((err) => {
                UserService.updateUser(telegram_id, { deactive: 1 })
                resolve(false)
            })
        }
    })
}

const sendPhoto = (bot, telegram_id, img, options = null) => {
    return new Promise(function(resolve, reject) {
        if (options) {
            bot.sendPhoto(telegram_id, img, options).then((res) => {
                resolve(res)
            }).catch((err) => {
                UserService.updateUser(telegram_id, { deactive: 1 })
                resolve(false)
            })
        } else {
            bot.sendPhoto(telegram_id, img).then((res) => {
                resolve(res)
            }).catch((err) => {
                UserService.updateUser(telegram_id, { deactive: 1 })
                resolve(false)
            })
        }
    })
}

exports.main = async (user, bot, msg, type) => {
    const telegram_id = user.telegram_id;

    switch (msg.text) {
        case 'Просмотреть профиль':
            await sendMessage(bot, telegram_id, 
                'Вот так я тебя всем показываю:'
            )

            if (user.avatar) {
                const text = {
                    'caption': utils.getUserString(user),
                    'parse_mode': 'html'
                }

                sendPhoto(bot, telegram_id, user.avatar, text)
            } else {
                sendMessage(bot, telegram_id, utils.getUserString(user), {'parse_mode': 'html'})
            }

            break;

        case 'Указать рейтинг в играх':
            await UserService.updateUser(telegram_id, { step: 14 })
            sendMessage(bot, telegram_id, 
                'Ну давай укажем, выбери игру снизу, в которой хочешь указать свой ранг.',
                keyboards.gamesKeyboard(utils.getUserGamesList(user))
            )
            break;

        case 'Задать аватар':
            await UserService.updateUser(telegram_id, { step: 7 })
            sendMessage(bot, telegram_id, 
                'Окей, я жду фотку.',
                keyboards.cancel
            )

            break;

        case 'Заполнить анкетные данные заново':
            await UserService.updateUser(telegram_id, { step: 1 })
            await sendMessage(bot, telegram_id, 
                'Зачем? Ну допустим...',
                keyboards.null
            )
            sendMessage(bot, telegram_id, 
                'Сколько тебе лет?'
            )

            break;

        case '⬅ Вернуться в главное меню':
            sendMessage(bot, telegram_id, 
                'Ага',
                keyboards.main
            )

            break;

        case 'Настройки профиля':
            sendMessage(bot, telegram_id, 
                'Ладно',
                keyboards.profile
            )

            break;

        case 'Связаться с GSpot':
            await sendMessage(bot, telegram_id, 
                'Чего тебе надо от них?\n' +
                'Скину контакты, но будь дружелюбен, а не как я.'
            )
            sendMessage(bot, telegram_id, utils.getContacts, {'parse_mode': 'html'})

            break;

        case 'Поиск игроков':
            if (!user.filters) {
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(utils.getDefaultFilters) })
                user.filters = utils.getDefaultFilters
            }

            await UserService.updateUser(telegram_id, { step: 8 })
            sendMessage(bot, telegram_id, 
                'Текущие фильтры поиска:\n' +
                utils.getFiltersString(user.filters),
                keyboards.search_filter
            )

            break;
    
        default:
            sendMessage(bot, telegram_id, 
                'Я не такой умный как ты, чего тебе надо от меня?\n' +
                'У тебя там по-любому кнопки снизу есть, на них и тыркай.',
                keyboards.main
            )
            break;
    }
}

exports.offerLikes = async (bot, user, msg) => {
    const data = msg.data.split('.')
    const telegram_id = data[1];
    const type = data[0]

    if (type === 'offer_like') {
        const like = await UserService.likeUser(user, telegram_id)
        if (like.type === 'mutually') {
            await bot.deleteMessage(user.telegram_id, msg.message.message_id)
            sendMessage(bot, like.user.telegram_id, 
                'У тебя взаимный лайк!\n' + 
                'Тебя лайкнул ' + utils.getUserLink(user) + '\n' +
                'Тыкай по нику и бегом общаться!\n\n' + 
                'Анкета:\n' + 
                utils.getUserString(user, true),
                { 'parse_mode': 'html', 'disable_web_page_preview': true }
            )
            sendMessage(bot, user.telegram_id, 
                'Отлично! +1 игрок в копилку\n' + 
                'Тыкай по нику и бегом общаться!\n\n' + 
                'Анкета:\n' + 
                utils.getUserString(like.user, true),
                { 'parse_mode': 'html', 'disable_web_page_preview': true }
            )
        } else {
            await bot.deleteMessage(user.telegram_id, msg.message.message_id)
        }

    } else if (type === 'offer_dislike') {
        await bot.deleteMessage(user.telegram_id, msg.message.message_id)
    }
}

exports.handle = async (bot, msg, type) => {
    const telegram_id = msg.from.id
    if (!telegram_id) {
        return false
    }

    if (WHITELIST && WHITELIST_USERS.indexOf(telegram_id) === -1){
        return await sendMessage(bot, telegram_id, 
            'В данный момент бот отдыхает, напишите позже', {parse_mode: "HTML"}
        )
    }

    let user = await UserService.getUserByTelegramID(telegram_id)

    if (user.deactive != 0) {
        UserService.updateUser(telegram_id, { deactive: 0 })
    }

    if (type === 'callback' && (/^offer_like\./.test(msg.data) || /^offer_dislike\./.test(msg.data))) {
        return this.offerLikes(bot, user, msg)
    }

    const step = user.step
    switch (step) {
        case 0: // Приветствие
            await UserService.setStep(telegram_id, 1)
            await sendMessage(bot, msg.from.id, 
                'Привет добро пожаловать в <b>GSPOT</b> - бот знакомств для геймеров.\n' + 
                'Я тебя раньше не видел...', {parse_mode: "HTML"}
            )
            sendMessage(bot, telegram_id, 
                'Давай создадим тебе анкету.\n' +
                'Сколько тебе лет?',
                keyboards.null
            )
            break;

        case 1: // Ввод возраста
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты там чо делаешь? Возраст цифрой, пожалуйста'
                )
                break;
            }

            const text = msg.text
            if (/^\d{1,3}$/.test(text)) {
                if(text < 6 || text > 80) {
                    sendMessage(bot, telegram_id, 
                        'Шутник? Нормальный введи, плз'
                    )
                    break;
                }

                await UserService.updateUser(telegram_id, { age: text, step: 2 })
                sendMessage(bot, telegram_id, 
                    'Окей, а пол у тебя какой?',
                    keyboards.genderKeyboard
                )
            } else {
                sendMessage(bot, telegram_id, 
                    'Ты что-то не понял, введи свой возраст ЦИФРОЙ -_-'
                )
            }
            break;

        case 2: // Ввод пола
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты делаешь что-то не то, нажми на кнопочки снизу!!!',
                    keyboards.genderKeyboard
                )
                break;
            }

            const gender = msg.text === 'Парень' ? 'man' : msg.text === 'Девушка' ? 'woman' : null 
            if (gender === null) {
                sendMessage(bot, telegram_id, 
                    'Ты со мной разговаривать пытаешься? Кнопки снизу!',
                    keyboards.genderKeyboard
                )
                break;
            }
            
            await UserService.updateUser(telegram_id, { gender, step: 3 })
            await sendMessage(bot, telegram_id, 
                msg.text + '? Ну допустим...',
                keyboards.null
            )
            sendMessage(bot, telegram_id,
                'Из какого ты города?\n' +
                'Напиши название.\n' +
                'Ну или прикрепи свою геолокацию, если тебе лень..\n' +
                '(прикрепить можно только с телефона)',
                keyboards.geolocation
            )
            break;

        case 3:  // Ввод города
            if (msg.location) {
                const city = await utils.getCityNameByCoords({ lat:msg.location.latitude, lon: msg.location.longitude })
                if (city) {
                    await UserService.updateUser(telegram_id, { city, step: 4 })
                    sendMessage(bot, telegram_id, 
                        'Окей, будем думать, что ты из города ' + city + '.\n' +
                        'Теперь напиши свой ник в играх, я буду его всем показывать.',
                        keyboards.null
                    )
                } else {
                    sendMessage(bot, telegram_id, 
                        'Слушай, я не могу понять где ты\n' +
                        'Попробуй отправить геолокацию ближайшего населённого пункта'
                    )
                }
            } else if(type === 'message') {
                const city = await utils.getCityNameByName(msg.text)
                if (city) {
                    await UserService.updateUser(telegram_id, { city, step: 4 })
                    sendMessage(bot, telegram_id, 
                        'Окей, будем думать, что ты из города ' + city + '.\n' +
                        'Теперь напиши свой ник в играх, я буду его всем показывать.',
                        keyboards.null
                    )
                } else {
                    sendMessage(bot, telegram_id, 
                        'Что это за город такой?\n' +
                        'Напиши нормально!'
                    )
                }
            } else {
                sendMessage(bot, telegram_id, 
                    'Уххх... не понимаю я тебя\n' +
                    'Либо напиши свою геолокацию, либо отправь ей через телеграм',
                    keyboards.geolocation
                )
            }
            
            break;

        case 4: // Ввод ника
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Я тебя что попросил сделать? Ник написать!!!'
                )
                break;
            }

            const nickname = msg.text.trim()
            if (nickname <= 3) {
                sendMessage(bot, telegram_id, 
                    nickname + '? Ты бы ещё меньше символов указал..\n' +
                    'Придумай ник от 4-х символов хотя бы'
                )
                break;
            }

            if (nickname < 15) {
                sendMessage(bot, telegram_id, 
                    nickname + '? Ты сочинение пишешь?\n' +
                    'Давай поменьше букв'
                )
                break;
            }

            await UserService.updateUser(telegram_id, { nickname, step: 5 })
            await sendMessage(bot, telegram_id, 
                nickname + '? Ты под чем его придумывал?\n' +
                'Ну хорошо, давай заполним игры.',
                keyboards.done
            )

            sendMessage(bot, telegram_id, 
                'Отметь кнопками ниже игры, в которые играешь\n\n' + 
                'Список игр:\n' +
                utils.getGamesList(utils.getUserGamesList(user)),
                keyboards.games()
            )
            
            break;

        case 5: // Ввод игр
            if (type !== 'callback') {
                if (msg.text !== 'Готово') {
                    sendMessage(bot, telegram_id, 
                        'Ты отметил игры в которые играешь?\n' +
                        'Если да, то нажми кнопку снизу',
                        keyboards.done
                    )
                    break;
                }
            }

            if (type === 'callback') {
                let userGames = utils.getUserGamesList(user)
                const game = msg.data

                const issetGame = userGames.indexOf(game)
                if (issetGame === -1) {
                    UserService.addGame(user, game)
                    userGames.push(game)
                } else {
                    UserService.deleteGame(user, game)
                    userGames.splice(issetGame, 1)
                }

                bot.editMessageText(
                    'Отметь кнопками ниже игры, в которые играешь\n\n' + 
                    'Список игр:\n' +
                    utils.getGamesList(userGames),
                    { 
                        chat_id: msg.message.chat.id,
                        message_id: msg.message.message_id,
                        parse_mode: "HTML",
                        reply_markup: keyboards.games(true)
                    }
                )
            } else {
                await UserService.updateUser(telegram_id, { step: 6 })
                sendMessage(bot, telegram_id, 
                    'Расскажи о себе пару слов. Ты кто вообще? Чем занимаешься по жизни?',
                    keyboards.null
                )
            }
            break;

        case 6: // Ввод описания
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты чего там тыркаешь? Буквами напиши о себе инфу!'
                )
                break;
            }

            const description = msg.text

            await UserService.updateUser(telegram_id, { description, step: 100 })
            sendMessage(bot, telegram_id, 
                'Лады, с регистрацией закончили.\n' +
                'Держи меню профиля, если хочешь что-то подправить.',
                keyboards.profile
            )

            break;

        case 7: // Аватар
            if (msg.text === '⬅ Вернуться обратно') {
                await UserService.updateUser(telegram_id, { step: 100 })
                
                sendMessage(bot, telegram_id, 
                    'Окей...',
                    keyboards.profile
                )
                break;
            }

            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Чего? Фотку отправь!',
                    keyboards.cancel
                )
                break;
            }

            if (!msg.photo) {
                sendMessage(bot, telegram_id, 
                    'Ты меня не понимаешь что ли? Либо фотку отправь, либо нажми кнопку снизу.',
                    keyboards.cancel
                )
                break;
            }

            await UserService.updateUser(telegram_id, { avatar: msg.photo[0].file_id, step: 100 })
            sendMessage(bot, telegram_id, 
                'Теперь все увидят эту фотку, ты этого хотел?..',
                keyboards.profile
            )

            break;

        case 8: // Этап поиска
            if (msg.data === 'like' || msg.data === 'dislike') {
                if (msg.data === 'like') {
                    const like = await UserService.likeUser(user)
                    switch (like.type) {
                        case 'like':
                            if (user.avatar) {
                                const text = {
                                    'caption': utils.getUserString(user) + '\n\nЭтот человек тебя лайкнул! Как тебе?',
                                    'parse_mode': 'html',
                                    'reply_markup': keyboards.offerLikeMarkup(user.telegram_id)
                                }
                
                                await sendPhoto(bot, like.user.telegram_id, user.avatar, text)
                            } else {
                                await sendMessage(bot, like.user.telegram_id, utils.getUserString(user), {
                                    'parse_mode': 'html',
                                    'reply_markup': keyboards.offerLikeMarkup(user.telegram_id)
                                })
                            }
                            break;
                        case 'existMutually':
                            sendMessage(bot, telegram_id, 
                                'Ты уже лайкал этого человека, у вас это взаимно, забыл?\n' +
                                'Может это освежит тебе память: ' + utils.getUserLink(like.user) 
                            )
                            break;
                        case 'exist':
                            sendMessage(bot, telegram_id, 
                                'Упс, а ты уже его лайкал, как такое могло произойти? 🤔'
                            )
                            break;
                        case 'mutually':
                            sendMessage(bot, like.user.telegram_id, 
                                'У тебя взаимный лайк!\n' + 
                                'Тебя лайкнул ' + utils.getUserLink(user) + '\n' +
                                'Тыкай по нику и бегом общаться!\n\n' + 
                                'Анкета:\n' + 
                                utils.getUserString(user, true),
                                { 'parse_mode': 'html', 'disable_web_page_preview': true }
                            )
                            sendMessage(bot, user.telegram_id, 
                                'Отлично! +1 игрок в копилку\n' + 
                                'Тыкай по нику и бегом общаться!\n\n' + 
                                'Анкета:\n' + 
                                utils.getUserString(like.user, true),
                                { 'parse_mode': 'html', 'disable_web_page_preview': true }
                            )
                            break;
                    }
                } else if(msg.data === 'dislike') {
                    // Дизлайк
                }

                if (msg.message.message_id !== user.search_message_id) {
                    try {
                        await bot.deleteMessage(telegram_id, msg.message.message_id)
                    } catch (error) {}
                    break;
                }

                if (user.search_message_id) {
                    try {
                        await bot.deleteMessage(telegram_id, user.search_message_id)
                    } catch (error) {}
                }

                let message = false
                const player = await UserService.getSearchUser(user, true)
                if (player) {
                    if (player.avatar) {
                        const text = {
                            'caption': utils.getUserString(player),
                            'parse_mode': 'html',
                            'reply_markup': keyboards.likesMarkup
                        }
        
                        message = await sendPhoto(bot, telegram_id, player.avatar, text)
                    } else {
                        message = await sendMessage(bot, telegram_id, utils.getUserString(player), {
                            'parse_mode': 'html',
                            'reply_markup': keyboards.likesMarkup
                        })
                    }
                } else {
                    message = await sendMessage(bot, telegram_id, 
                        'Увы, все игроки закончились...\n' +
                        'Можешь попробовать поменять фильтры.'
                    )
                    await UserService.updateUser(telegram_id, { search_message_id: message.message_id })
                }

                if (message) {
                    await UserService.updateUser(telegram_id, { search_message_id: message.message_id })
                }
                break;
            }

            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты куда жмякаешь?!',
                    keyboards.search_filter
                )
                break;
            }

            switch (msg.text) {
                case 'Поиск':
                    if (user.search_message_id) {
                        try {
                            await bot.deleteMessage(telegram_id, user.search_message_id)
                        } catch (error) {}
                    }

                    let message = false
                    const player = await UserService.getSearchUser(user)
                    if (player) {
                        if (player.avatar) {
                            const text = {
                                'caption': utils.getUserString(player),
                                'parse_mode': 'html',
                                'reply_markup': keyboards.likesMarkup
                            }

                            message = await sendPhoto(bot, telegram_id, player.avatar, text)
                        } else {
                            message = await sendMessage(bot, telegram_id, utils.getUserString(player), {
                                'parse_mode': 'html',
                                'reply_markup': keyboards.likesMarkup
                            })
                        }
                    } else {
                        message = await sendMessage(bot, telegram_id, 
                            'Увы, все игроки закончились...\n' +
                            'Можешь попробовать поменять фильтры.'
                        )
                        await UserService.updateUser(telegram_id, { search_message_id: message.message_id })
                    }

                    if (message) {
                        await UserService.updateUser(telegram_id, { search_message_id: message.message_id })
                    }

                    break;

                case 'Просмотреть фильтры':
                    if (!user.filters) {
                        await UserService.updateUser(telegram_id, { filters: JSON.stringify(utils.getDefaultFilters) })
                        user.filters = utils.getDefaultFilters
                    }

                    sendMessage(bot, telegram_id, 
                        'Фильтры:\n' +
                        utils.getFiltersString(user.filters),
                        keyboards.search_filter
                    )
                    break;

                case 'Изменить фильтры поиска':
                    sendMessage(bot, telegram_id, 
                        'Что будем менять?',
                        keyboards.change_filters
                    )
                    
                    if (user.search_message_id) {
                        try {
                            await bot.deleteMessage(telegram_id, user.search_message_id)
                        } catch (error) {}
                    }

                    await UserService.updateUser(telegram_id, { step: 9, search_message_id: null })

                    break;

                case '⬅ Вернуться обратно':
                    if (user.search_message_id) {
                        try {
                            await bot.deleteMessage(telegram_id, user.search_message_id)
                        } catch (error) {}
                    }
                    await UserService.updateUser(telegram_id, { step: 100, search_message_id: null })

                    sendMessage(bot, telegram_id, 
                        'Уже нашёл кого хотел?',
                        keyboards.main
                    )
                    break;
            
                default:
                    sendMessage(bot, telegram_id, 
                        'Когда ты научишься пользоваться кнопками?',
                        keyboards.search_filter
                    )
                    break;
            }

            break;

        case 9: // Этап смены фильтров
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты чо делаешь?!',
                    keyboards.change_filters
                )
                break;
            }

            switch (msg.text) {
                case 'Изменить пол':
                    await UserService.updateUser(telegram_id, { step: 10 })
                    sendMessage(bot, telegram_id, 
                        'Выбери пол',
                        keyboards.filterGender
                    )
                    break;

                case 'Изменить возраст':
                    await UserService.updateUser(telegram_id, { step: 11 })
                    sendMessage(bot, telegram_id, 
                        'Напиши возраст цифрой, либо используй кнопку ниже.\n' +
                        'От скольки лет будем искать людишек?',
                        keyboards.any
                    )
                    break;

                case 'Изменить город':
                    await UserService.updateUser(telegram_id, { step: 12 })
                    sendMessage(bot, telegram_id,
                        'Либо напиши город, либо отправь геолокацию.\n' +
                        'Если лень, то используй кнопки снизу.',
                        keyboards.filtersCity
                    )
                    break;

                case 'Изменить игры':
                    await UserService.updateUser(telegram_id, { step: 13 })
                    await sendMessage(bot, telegram_id, 
                        'Отметь игры, в которые должен играть человек',
                        keyboards.filtersGames
                    )
                    sendMessage(bot, telegram_id, 
                        utils.getGamesList(user.filters.games.map((game) => game.game)),
                        keyboards.games()
                    )
                    break;

                case 'Изменить искомый рейтинг в играх':
                    if (!user.filters.games || user.filters.games.length === 0) {
                        sendMessage(bot, telegram_id, 
                            'У тебя не указаны определённые игры, измени фильтр игр, а потом укажи для них нужные рейтинги...'
                        )
                    } else {
                        await UserService.updateUser(telegram_id, { step: 16 })
                        sendMessage(bot, telegram_id, 
                            'Выбери игру снизу, чтобы указать минимальный рейтинг, который игрок должен иметь.',
                            keyboards.gamesKeyboard(user.filters.games.map((game) => game.game))
                        )
                    }
                    break;

                case '⬅ Вернуться обратно':
                    await UserService.updateUser(telegram_id, { step: 8 })
                    sendMessage(bot, telegram_id, 
                        'Ну пойдём обратно',
                        keyboards.search_filter
                    )
                    break;
            
                default:
                    sendMessage(bot, telegram_id, 
                        'Когда ты научишься пользоваться кнопками?',
                        keyboards.change_filters
                    )
                    break;
            }

            break;

        case 10: // Изменить пол (фильтр)
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Только 13.34% людей замечают мои кнопки...',
                    keyboards.filterGender
                )
                break;
            }

            switch (msg.text) {
                case 'Парень':
                    user.filters.gender = 'man'
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                    sendMessage(bot, telegram_id, 
                        'Поищем пацана',
                        keyboards.change_filters
                    )
                    break;

                case 'Девушка':
                    user.filters.gender = 'woman'
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                    sendMessage(bot, telegram_id, 
                        'Будем искать девушек',
                        keyboards.change_filters
                    )
                    break;

                case 'Любой':
                    user.filters.gender = null
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                    sendMessage(bot, telegram_id, 
                        'Да, нам без разницы кого искать',
                        keyboards.change_filters
                    )
                    break;
            
                default:
                    sendMessage(bot, telegram_id, 
                        'Когда ты научишься пользоваться кнопками?',
                        keyboards.filterGender
                    )
                    break;
            }

            break;

        case 11: // Ввод возраста (фильтр)
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Ты там чо делаешь? Возраст цифрой, пожалуйста, либо нажми кнопку снизу',
                    keyboards.any
                )
                break;
            }

            if (msg.text === 'Любой') {
                user.filters.age = null
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                sendMessage(bot, telegram_id, 
                    'Ну любой, так любой',
                    keyboards.change_filters
                )
                break;
            }

            if (/^\d{1,3}$/.test(msg.text)) {
                if(msg.text < 6 || msg.text > 80) {
                    sendMessage(bot, telegram_id, 
                        'Шутник? Нормальный введи, плз',
                        keyboards.any
                    )
                    break;
                }

                user.filters.age = msg.text
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                sendMessage(bot, telegram_id, 
                    'Ищем тех, кому больше ' + msg.text,
                    keyboards.change_filters
                )
            } else {
                sendMessage(bot, telegram_id, 
                    'Ты что-то не понял, введи свой возраст ЦИФРОЙ -_-',
                    keyboards.any
                )
            }
            break;

        case 12: // Ввод город (фильтр)
            if (msg.text === 'Указать мой город') {
                user.filters.city = user.city
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                sendMessage(bot, telegram_id, 
                    'Значит будем искать людей из города ' + user.city,
                    keyboards.change_filters
                )
                break;
            }

            if (msg.text === 'Любой') {
                user.filters.city = null
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })
                sendMessage(bot, telegram_id, 
                    'Любой - значит любой, без б',
                    keyboards.change_filters
                )
                break;
            }

            if (msg.location) {
                const city = await utils.getCityNameByCoords({ lat:msg.location.latitude, lon: msg.location.longitude })
                if (city) {
                    user.filters.city = city
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })

                    sendMessage(bot, telegram_id, 
                        'Значит будем искать людей из города ' + city,
                        keyboards.change_filters
                    )
                } else {
                    sendMessage(bot, telegram_id, 
                        'Слушай, я не могу понять где это\n' +
                        'Попробуй используй кнопки ниже, пожалуйста',
                        keyboards.filtersCity
                    )
                }
            } else if(type === 'message') {
                const city = await utils.getCityNameByName(msg.text)
                if (city) {
                    user.filters.city = city
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })

                    sendMessage(bot, telegram_id, 
                        'Значит будем искать людей из города ' + city,
                        keyboards.change_filters
                    )
                } else {
                    sendMessage(bot, telegram_id, 
                        'Не знаю я города с названием "'+msg.text+'"\n' +
                        'Попробуй использовать кнопки ниже, или пиши нормально',
                        keyboards.filtersCity
                    )
                }
            } else {
                sendMessage(bot, telegram_id, 
                    'Ты делаешь что-то не то, используй кнопки ниже, либо отправь геолокацию прикрепом',
                    keyboards.filtersCity
                )
            }
            break;

        case 13: 
            if (type === 'callback') {
                let userGames = user.filters.games === null ? [] : user.filters.games
                const game = { game: msg.data, rank: null }

                const issetGame = userGames.findIndex(x => x.game === msg.data)
                if (issetGame === -1) {
                    userGames.push(game)
                } else {
                    userGames.splice(issetGame, 1)
                }

                
                user.filters.games = userGames
                await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), search_offset: null })

                bot.editMessageText(
                    utils.getGamesList(userGames.map((game) => game.game)),
                    { 
                        chat_id: msg.message.chat.id,
                        message_id: msg.message.message_id,
                        parse_mode: "HTML",
                        reply_markup: keyboards.games(true)
                    }
                )
            } else {
                if (msg.text === 'Любые игры') {
                    user.filters.games = []
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters), step: 9, search_offset: null })

                    sendMessage(bot, telegram_id, 
                        'Ты не ради игр? Ради общения? 😉',
                        keyboards.change_filters
                    )
                } else if(msg.text === '⬅ Вернуться обратно') {
                    await UserService.updateUser(telegram_id, { step: 9 })
                    sendMessage(bot, telegram_id, 
                        'Ага, ладно',
                        keyboards.change_filters
                    )
                } else {
                    sendMessage(bot, telegram_id, 
                        'Когда моей клавиатурой научишься пользоваться, человек?',
                        keyboards.filtersGames
                    )
                }
            }
        
            break;

        case 14:
            if (type === 'message' && msg.text === '⬅ Вернуться в главное меню') {
                await UserService.updateUser(telegram_id, { step: 100 })
                sendMessage(bot, telegram_id, 
                    'Как скажешь',
                    keyboards.profile
                )
                break;
            }
            if (type === 'message' && getGamesList().indexOf(msg.text) !== -1) {
                await UserService.updateUser(telegram_id, { step: 15 })
                sendMessage(bot, telegram_id, 
                    'Окей, какой у тебя ранг в ' + msg.text + '?',
                    keyboards.ranksGame(msg.text)
                )
            } else {
                sendMessage(bot, telegram_id, 
                    'Кожаный, игру выбери из клавиатуры снизу!',
                    keyboards.gamesKeyboard(utils.getUserGamesList(user))
                )
            }
            
            break;

        case 15:
            if (type === 'callback') {
                await UserService.updateUser(telegram_id, { step: 100 })
                await bot.deleteMessage(telegram_id, msg.message.message_id)
                const data = utils.parseJSON(msg.data)
                if (data && data.game) {
                    const rank = getRankId(data.game, data.rank)
                    await UserService.updateRank(user, data.game, rank)
                    if (data.rank) {
                        sendMessage(bot, telegram_id,
                            'Я расскажу всем, какое у тебя звание в ' + data.game,
                            keyboards.profile
                        )
                    } else {
                        sendMessage(bot, telegram_id,
                            'Хорошо, я убрал твой ранг в ' + data.game,
                            keyboards.profile
                        )
                    }
                    
                } else {
                    sendMessage(bot, telegram_id, 
                        'Ты куда-то не туда кликнул, поэтому я не записал твой ранг',
                        keyboards.profile
                    )
                }
                
                break;
            } else {
                sendMessage(bot, telegram_id, 
                    'Сначала выбери ранг из сообщения выше!'
                )
            }
            
            break;

        case 16:
            if (type === 'message' && msg.text === '⬅ Вернуться в главное меню') {
                await UserService.updateUser(telegram_id, { step: 9 })
                sendMessage(bot, telegram_id, 
                    'Угусь',
                    keyboards.change_filters
                )
                break;
            }
            if (type === 'message' && getGamesList().indexOf(msg.text) !== -1) {
                await UserService.updateUser(telegram_id, { step: 17 })
                sendMessage(bot, telegram_id, 
                    'Ага, каким минимальным уровнем должен обладать игрок в ' + msg.text + '?',
                    keyboards.ranksGame(msg.text)
                )
            } else {
                sendMessage(bot, telegram_id, 
                    'Кожаный, игру выбери из клавиатуры снизу!',
                    keyboards.gamesKeyboard(user.filters.games.map((game) => game.game))
                )
            }
            
            break;

        case 17:
            if (type === 'callback') {
                await UserService.updateUser(telegram_id, { step: 16 })
                await bot.deleteMessage(telegram_id, msg.message.message_id)
                const data = utils.parseJSON(msg.data)
                if (data && data.game) {
                    const rank = getRankId(data.game, data.rank)
                    const indexGame = user.filters.games.findIndex(x => x.game === data.game)
                    user.filters.games[indexGame].rank = rank
                    await UserService.updateUser(telegram_id, { filters: JSON.stringify(user.filters) })
                    if (data.rank) {
                        sendMessage(bot, telegram_id,
                            'Хорошо, игрок должен обладать минимум рангом ' + data.rank + ' в ' + data.game
                        )
                    } else {
                        sendMessage(bot, telegram_id,
                            'Хорошо, не буду фильтровать по рейтингу в ' + data.game
                        )
                    }
                    
                } else {
                    sendMessage(bot, telegram_id, 
                        'Ты куда-то не туда кликнул, поэтому я не записал тебе игру'
                    )
                }
                
                break;
            } else {
                sendMessage(bot, telegram_id, 
                    'Сначала выбери ранг из сообщения выше!'
                )
            }
            
            break;
    
        default: // Общий этап
            if (type !== 'message') {
                sendMessage(bot, telegram_id, 
                    'Я не такой умный как ты, чего тебе надо от меня?\n' +
                    'У тебя там по-любому кнопки снизу есть, на них и тыркай.',
                    keyboards.profile
                )
            } else {
                await this.main(user, bot, msg, type);
            }
            break;
    }
}

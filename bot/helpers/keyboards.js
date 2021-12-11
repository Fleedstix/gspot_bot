const games = require('./games')

exports.genderKeyboard = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Парень' },
                { text: 'Девушка' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.likesMarkup = {
    inline_keyboard: [
        [ 
            { text: 'Нравится 👍', callback_data: 'like' }, 
            { text: 'Не нравится 👎', callback_data: 'dislike' } 
        ]
    ]
}

exports.offerLikeMarkup = (telegram_id) => {
    return { inline_keyboard: [
            [ 
                { text: 'Убрать ❌', callback_data: 'offer_dislike.' + telegram_id }, 
                { text: 'Мне нравится 👍', callback_data: 'offer_like.' + telegram_id} 
            ]
        ]
    }
}

exports.filterGender = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Парень' },
                { text: 'Девушка' },
                { text: 'Любой' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.geolocation = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Отправить местоположение', request_location: true }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}


exports.null = { 
    parse_mode: "HTML",
    reply_markup: {
        remove_keyboard: true
    }
}

exports.ranksGame = (game) => {
    const ranksButtons = games.getGamesRanks(game).map((rank) => {
        return [ { text: rank, callback_data: JSON.stringify({ game, rank }) } ]
    })

    return { 
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [[{ text: 'Не указывать', callback_data: JSON.stringify({ game, rank: null }) }], ...ranksButtons]
        }
    }
}

exports.games = (only_markup = false) => {
    const gamesButtons = games.getGamesList().map((game) => {
        return [ { text: game, callback_data: game } ]
    })

    if (only_markup) {
        return {
            inline_keyboard: gamesButtons
        }
    } else {
        return { 
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: gamesButtons
            }
        }
    }
}

exports.gamesKeyboard = (userGames = null) => {
    let gamesButtons = null
    if (userGames) {
        gamesButtons = userGames.map((game) => {
            return [ { text: game } ]
        })
    } else {
        gamesButtons = games.getGamesList().map((game) => {
            return [ { text: game } ]
        })
    }
    

    return { 
        parse_mode: "HTML",
        reply_markup: {
            keyboard: [
                [
                    { text: '⬅ Вернуться в главное меню' }
                ],
                ...gamesButtons
            ],
            resize_keyboard: true
        }
    }
}

exports.profile = { 
    reply_markup: {
        keyboard: [
            [ { text: 'Просмотреть профиль' }, { text: 'Задать аватар' } ],
            [ { text: 'Указать рейтинг в играх' }, { text: 'Заполнить анкетные данные заново' } ],
            [ { text: '⬅ Вернуться в главное меню' } ]
        ],
        resize_keyboard: true
    }
}

exports.main = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [ { text: 'Настройки профиля' } ],
            [ { text: 'Поиск игроков' } ],
            [ { text: 'Связаться с GSpot' } ]
        ],
        resize_keyboard: true
    }
}

exports.search_filter = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [ { text: 'Поиск' } ],
            [ { text: 'Просмотреть фильтры' }, { text: 'Изменить фильтры поиска' } ],
            [ { text: '⬅ Вернуться обратно' } ]
        ],
        resize_keyboard: true
    }
}

exports.change_filters = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [ { text: 'Изменить пол' }, { text: 'Изменить возраст' }, { text: 'Изменить город' } ],
            [ { text: 'Изменить игры' }, { text: 'Изменить искомый рейтинг в играх' } ],
            [ { text: '⬅ Вернуться обратно' } ]
        ],
        resize_keyboard: true
    }
}

exports.done = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Готово' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.cancel = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: '⬅ Вернуться обратно' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.filtersGames = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Любые игры' },
                { text: '⬅ Вернуться обратно' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.any = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Любой' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

exports.filtersCity = { 
    parse_mode: "HTML",
    reply_markup: {
        keyboard: [
            [
                { text: 'Указать мой город' },
                { text: 'Любой' }
            ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    }
}

const fetch = require('node-fetch');
const games = require('./games')
const { DADATA_TOKEN }= require('../config')

exports.getContacts = '<b>VK:</b> https://vk.com/gspot.team'
exports.getDefaultFilters = {
    gender: null,
    age: null,
    city: null,
    games: []
}

exports.getUserGamesList = (user) => {
    return user.games.map((game) => {
        return game.game_name
    })
}

exports.getGamesList = (userGames) => {
    if (!userGames) {
        userGames = []
    }

    let gamesList = ''
    games.getGamesList().forEach(game => {
        gamesList += userGames.indexOf(game) !== -1 ? '<b>[✓]</b>  '  + game + '\n' : '<b>[   ]</b>  ' + game + '\n'
    });

    return gamesList
}

exports.getUserLink = (user) => {
    return `<a href="tg://user?id=${user.telegram_id}">${user.nickname || 'Неопределено'}</a>`
    // return `<a href="https://t.me/${user.telegram_username}">${user.nickname || 'Неопределено'}</a>`
}

exports.parseJSON = (string) => {
    try {
        return JSON.parse(string)
    } catch (error) {
        return null
    }
}

exports.getUserString = (user, useLink = false) => {
    let string = []

    if (useLink) {
        string.push(this.getUserLink(user))
    } else {
        string.push(`<b>${user.nickname}</b>`)
    }
    string.push(`${user.city}, ${user.age} лет\n`)

    if (user.description) {
        string.push(`<i>О себе:</i>\n${user.description}\n`)
    }
    
    if (user.games && user.games.length > 0) {
        let gamesList = []
        for (const game of user.games) {
            gamesList.push(game.game_name + (game.rank_id !== null ? ' (' + games.getGameRank(game.game_name, game.rank_id) + ')' : ''))
        }
        string.push(`<i>Игры:</i>\n` + gamesList.join('\n'))
    }

    return string.join('\n')
}

exports.formatGender = (gender) => {
    let formatted = 'неизвестно'
    switch (gender) {
        case 'man':
            formatted = 'парень'
            break;
    
        case 'woman':
            formatted = 'девушка'
            break;

        case 'cancer':
            formatted = 'рак'
            break;
    }
    return formatted
}

exports.deformatGender = (filters) => {
    return null
}

exports.getFiltersString = (filters) => {
    let gamesString = false
    if (filters.games && filters.games.length > 0) {
        gamesString = filters.games.map((game) => {
            const rank = game.rank ? ' (от ' + games.getGameRank(game.game, game.rank) + ')' : ''
            return game.game + rank
        })
    }

    return `<b>Пол:</b> ${filters.gender ? this.formatGender(filters.gender) : 'любой'}\n` +
    `<b>Возраст:</b> ${filters.age ? 'от ' + filters.age + ' лет': 'любой'}\n` +
    `<b>Город:</b> ${filters.city ? filters.city : 'любой'}\n` +
    `<b>Игры:</b> ${gamesString ? gamesString.join(', ') : 'любые'}`
}

exports.getCityNameByCoords = async ({lat, lon}) => {
    var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address"
    var token = DADATA_TOKEN
    var query = { lat, lon, count: 1, radius_meters: 1000 }

    var options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token
        },
        body: JSON.stringify(query)
    }

    const data = await fetch(url, options)
    .then(response => response.json())
    .catch(error => console.log("error", error));

    if (data && data.suggestions && data.suggestions[0] && data.suggestions[0].data.city) {
        return data.suggestions[0].data.city
    } else {
        return false
    }
}

exports.getCityNameByName = async (city) => {
    var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
    var token = DADATA_TOKEN
    var query = city

    var options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token
        },
        body: JSON.stringify({query: city, count: 1})
    }

    const data = await fetch(url, options)
    .then(response => response.json())
    .catch(error => console.log("error", error));

    if (data && data.suggestions && data.suggestions[0] && data.suggestions[0].data.city) {
        return data.suggestions[0].data.city
    } else {
        return false
    }
}

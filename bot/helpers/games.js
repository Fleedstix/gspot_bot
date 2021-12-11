const { GAMES } = require('../config')

exports.games = GAMES

exports.getRankId = (game, rank_name) => {
    const rank_id = this.games[game].indexOf(rank_name)
    return rank_id !== -1 ? rank_id : null
}

exports.getGamesList = () => {
    return Object.keys(this.games)
}

exports.getGamesRanks = (game) => {
    return this.games[game] || null
}

exports.getGameRank = (game, rank_id) => {
    return this.games[game][rank_id]
} 
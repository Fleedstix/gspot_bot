const UserRepository = require('../repositories/user.repository.js')
const LikeRepository = require('../repositories/like.repository.js')
const GameRepository = require('../repositories/game.repository.js')
const { Sequelize } = require('sequelize')

exports.getUserByTelegramID = async (id) => {
  const user = await UserRepository.findOne({
      where: {
          telegram_id: id
      },
      include: [{
        model: GameRepository,
        as: 'games',
        attributes: ['game_name', 'rank_id']
      }],
    })
  .then((res) => {
      return res
  })

  if (user) {
    user.filters = JSON.parse(user.filters)
    return user
  } else {
    return await UserRepository.create({
        telegram_id: id,
        step: 0,
        deactive: 0
      })
    .then((res) => {
        return res
    })
  }
}

exports.updateRank = async (user, game, rank) => {
  return await GameRepository.update({
    rank_id: rank
  },
  {
    where: { 
      user_id: user.user_id, 
      game_name: game 
    }
  })
  .then((res) => {
      return res
  })
}

exports.addGame = async (user, game) => {
  return await GameRepository.create({
    user_id: user.user_id,
    game_name: game
  })
  .then((res) => {
      return res
  })
}

exports.deleteGame = async (user, game) => {
  return await GameRepository.destroy({
    where: {
      user_id: user.user_id,
      game_name: game
    }
  })
  .then((res) => {
      return res
  })
}

exports.setStep = async (telegram_id, step) => {
    return await UserRepository.update({
        step
      },
      {
        where: { telegram_id }
      }
    )
    .then((res) => {
        return res
    })
}

exports.updateUser = async (telegram_id, data) => {
    return await UserRepository.update(
      data,
      {
        where: { telegram_id }
      }
    )
    .then((res) => {
        return res
    })
}

exports.likeUser = async (user, telegram_id = false) => {
  if (!telegram_id) {
    likedUser = await this.getSearchUser(user)

    if (!likedUser) return { type: 'error' }
  } else {
    likedUser = await this.getUserByTelegramID(telegram_id)
  }

  if (!likedUser) return null

  const exists = await LikeRepository.findOne({
    where: {
      user_id: user.user_id,
      liked_user_id: likedUser.user_id
    }
  })

  const mutually = await LikeRepository.findOne({
    where: {
      user_id: likedUser.user_id,
      liked_user_id: user.user_id
    }
  })

  if (exists && mutually) {
    return { type: 'existMutually', user: likedUser }
  } else if (exists) {
    return { type: 'exist' }
  } else if (mutually) {
    await LikeRepository.create({
      user_id: user.user_id,
      liked_user_id: likedUser.user_id
    })
    .then((res) => {
        return res
    })

    return { type: 'mutually', user: likedUser }
  } else {
    await LikeRepository.create({
      user_id: user.user_id,
      liked_user_id: likedUser.user_id
    })
    .then((res) => {
        return res
    })

    return { type: 'like', user: likedUser }
  }
}

exports.getSearchUser = async (user, next = false) => {
  let conditions = []
  conditions.push(`deactive != 1 AND user_id NOT IN (SELECT liked_user_id FROM likes WHERE user_id = ${user.user_id}) AND user_id != ${user.user_id} AND nickname IS NOT NULL`)

  if (user.filters.games && user.filters.games.length !== 0) {
    let gamesConditions = []
    for (const game of user.filters.games) {
      const rank = game.rank ? ' AND rank_id >= ' + game.rank : ''
      gamesConditions.push("(game_name = '" + game.game + "'" + rank + ')')
    }

    const whereClause = 'user_id != ' + user.user_id + ' AND ' + gamesConditions.join(' OR ')

    conditions.push(`user_id IN (SELECT user_id FROM games WHERE ${whereClause})`)
  }

  if (user.filters.age) {
    conditions.push(`age >= ${user.filters.age}`)
  }

  if (user.filters.gender) {
    conditions.push(`gender = '${user.filters.gender}'`)
  }

  if (user.filters.city) {
    conditions.push(`city = '${user.filters.city}'`)
  }

  if (next) {
    user.search_offset += 1
    await this.updateUser(user.telegram_id, { search_offset: user.search_offset })
  }

  console.log('----')
  const player = await UserRepository.findOne({
    where: Sequelize.literal(conditions.join(' AND ')),
    include: [{
      model: GameRepository,
      as: 'games',
      attributes: ['game_name', 'rank_id']
    }],
    offset: user.search_offset
  })
  .then((res) => {
      return res
  })

  if (player) {
    player.filters = JSON.parse(player.filters)
  }
  
  return player
}

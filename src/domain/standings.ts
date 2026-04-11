import { getMatchScore, isMatchComplete } from './scoring'
import type { Match, Player, StandingEntry } from './types'

const createEntry = (player: Player): StandingEntry => ({
  playerId: player.id,
  playerName: player.name,
  gender: player.gender,
  rank: 0,
  totalPoints: 0,
  pointsAgainst: 0,
  pointDiff: 0,
  wins: 0,
  losses: 0,
  matchesPlayed: 0,
  byes: 0,
})

export const buildStandings = (players: Player[], matches: Match[]) => {
  const entries = new Map(players.map((player) => [player.id, createEntry(player)]))

  for (const match of matches) {
    if (!isMatchComplete(match)) {
      continue
    }

    const score = getMatchScore(match)
    const leftWon = score.left > score.right

    for (const playerId of match.teamLeft) {
      const entry = entries.get(playerId)

      if (!entry) {
        continue
      }

      entry.matchesPlayed += 1
      entry.totalPoints += score.left
      entry.pointsAgainst += score.right
      entry.pointDiff += score.left - score.right
      entry.wins += leftWon ? 1 : 0
      entry.losses += leftWon ? 0 : 1
    }

    for (const playerId of match.teamRight) {
      const entry = entries.get(playerId)

      if (!entry) {
        continue
      }

      entry.matchesPlayed += 1
      entry.totalPoints += score.right
      entry.pointsAgainst += score.left
      entry.pointDiff += score.right - score.left
      entry.wins += leftWon ? 0 : 1
      entry.losses += leftWon ? 1 : 0
    }
  }

  const maxMatchesPlayed = Math.max(0, ...[...entries.values()].map((entry) => entry.matchesPlayed))
  const standings = [...entries.values()].map((entry) => ({
    ...entry,
    byes: Math.max(maxMatchesPlayed - entry.matchesPlayed, 0),
  }))

  standings.sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints
    }

    if (right.wins !== left.wins) {
      return right.wins - left.wins
    }

    if (right.pointDiff !== left.pointDiff) {
      return right.pointDiff - left.pointDiff
    }

    return left.playerName.localeCompare(right.playerName)
  })

  return standings.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}

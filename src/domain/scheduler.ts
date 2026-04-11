import { buildStandings } from './standings'
import type {
  GeneratorResult,
  Match,
  Player,
  StandingEntry,
  TournamentConfig,
} from './types'
import { chunk, createId, rotate, shuffle } from './utils'

type Pair = [string, string]
type Quartet = [string, string, string, string]
type PartnerHistory = Map<string, number>
type OpponentHistory = Map<string, number>

const pairKey = (left: string, right: string) => [left, right].sort().join(':')

const createMatch = (
  round: number,
  court: number,
  teamLeft: Pair,
  teamRight: Pair,
  pointsTarget: number,
): Match => ({
  id: createId(),
  round,
  court,
  teamLeft,
  teamRight,
  pointsTarget,
  pointLog: [],
  createdAt: new Date().toISOString(),
})

const applyCourtCapacity = (matches: Match[], courts: number) => {
  const actualMatches: Match[] = []
  let actualRound = 1

  const groupedByLogicalRound = [...new Set(matches.map((match) => match.round))]
    .sort((left, right) => left - right)
    .map((round) => matches.filter((match) => match.round === round))

  for (const roundMatches of groupedByLogicalRound) {
    const courtBatches = chunk(roundMatches, Math.max(courts, 1))

    for (const batch of courtBatches) {
      batch.forEach((match, index) => {
        actualMatches.push({
          ...match,
          round: actualRound,
          court: index + 1,
        })
      })

      actualRound += 1
    }
  }

  return actualMatches
}

const registerMatchHistory = (
  teamLeft: Pair,
  teamRight: Pair,
  partnerHistory: PartnerHistory,
  opponentHistory: OpponentHistory,
) => {
  for (const [first, second] of [teamLeft, teamRight]) {
    const key = pairKey(first, second)
    partnerHistory.set(key, (partnerHistory.get(key) ?? 0) + 1)
  }

  for (const leftPlayer of teamLeft) {
    for (const rightPlayer of teamRight) {
      const key = pairKey(leftPlayer, rightPlayer)
      opponentHistory.set(key, (opponentHistory.get(key) ?? 0) + 1)
    }
  }
}

const buildHistoryMaps = (matches: Match[]) => {
  const partnerHistory: PartnerHistory = new Map()
  const opponentHistory: OpponentHistory = new Map()

  for (const match of matches) {
    registerMatchHistory(match.teamLeft, match.teamRight, partnerHistory, opponentHistory)
  }

  return { partnerHistory, opponentHistory }
}

const candidatePenalty = (
  teamLeft: Pair,
  teamRight: Pair,
  partnerHistory: PartnerHistory,
  opponentHistory: OpponentHistory,
) => {
  let penalty = 0

  penalty += (partnerHistory.get(pairKey(teamLeft[0], teamLeft[1])) ?? 0) * 12
  penalty += (partnerHistory.get(pairKey(teamRight[0], teamRight[1])) ?? 0) * 12

  for (const leftPlayer of teamLeft) {
    for (const rightPlayer of teamRight) {
      penalty += (opponentHistory.get(pairKey(leftPlayer, rightPlayer)) ?? 0) * 4
    }
  }

  return penalty
}

const createRoundRobinPairings = (playerIds: string[]) => {
  const working = [...playerIds]
  const rounds: Pair[][] = []

  for (let round = 0; round < working.length - 1; round += 1) {
    const roundPairs: Pair[] = []

    for (let index = 0; index < working.length / 2; index += 1) {
      roundPairs.push([working[index], working[working.length - 1 - index]])
    }

    rounds.push(roundPairs)

    const fixed = working[0]
    const rotated = [fixed, working[working.length - 1], ...working.slice(1, -1)]

    for (let index = 0; index < rotated.length; index += 1) {
      working[index] = rotated[index]
    }
  }

  return rounds
}

const chooseBestTeamingForQuartet = (
  quartet: Quartet,
  partnerHistory: PartnerHistory,
  opponentHistory: OpponentHistory,
) => {
  const [first, second, third, fourth] = quartet

  const candidates = [
    { teamLeft: [first, second] as Pair, teamRight: [third, fourth] as Pair },
    { teamLeft: [first, third] as Pair, teamRight: [second, fourth] as Pair },
    { teamLeft: [first, fourth] as Pair, teamRight: [second, third] as Pair },
  ]

  return candidates.reduce((best, candidate) => {
    const penalty = candidatePenalty(
      candidate.teamLeft,
      candidate.teamRight,
      partnerHistory,
      opponentHistory,
    )

    if (!best || penalty < best.penalty) {
      return { ...candidate, penalty }
    }

    return best
  }, null as null | { teamLeft: Pair; teamRight: Pair; penalty: number })!
}

const buildAmericanoBalancedMatches = (playerIds: string[], config: TournamentConfig) => {
  const warnings: string[] = []

  if (playerIds.length % 4 !== 0) {
    return {
      matches: [],
      warnings: [
        'Mode balanced untuk Americano idealnya jumlah pemain kelipatan 4. Gunakan random atau ubah jumlah pemain.',
      ],
    }
  }

  const pairRounds = createRoundRobinPairings(shuffle(playerIds))
  const partnerHistory: PartnerHistory = new Map()
  const opponentHistory: OpponentHistory = new Map()
  const matches: Match[] = []
  const rounds = Math.min(config.rounds, pairRounds.length)

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    const pairings = pairRounds[roundIndex]
    const courtPairs = chunk(pairings, 2)

    courtPairs.forEach(([firstPair, secondPair], index) => {
      if (!firstPair || !secondPair) {
        return
      }

      const best = chooseBestTeamingForQuartet(
        [firstPair[0], firstPair[1], secondPair[0], secondPair[1]],
        partnerHistory,
        opponentHistory,
      )

      matches.push(
        createMatch(roundIndex + 1, index + 1, best.teamLeft, best.teamRight, config.pointsPerMatch),
      )
      registerMatchHistory(best.teamLeft, best.teamRight, partnerHistory, opponentHistory)
    })
  }

  if (config.rounds > pairRounds.length) {
    warnings.push(
      `Americano balanced paling natural berhenti di ${pairRounds.length} ronde untuk ${playerIds.length} pemain. Ronde sisanya tidak dibuat.`,
    )
  }

  const limitedMatches = applyCourtCapacity(matches, config.courts)

  if (config.courts < playerIds.length / 4) {
    warnings.push(
      'Jumlah court lebih sedikit dari match serentak yang ideal, jadi jadwal dibagi ke beberapa wave ronde.',
    )
  }

  return { matches: limitedMatches, warnings }
}

const chooseByePlayers = (
  orderedPlayerIds: string[],
  byesNeeded: number,
  matches: Match[],
  standings: StandingEntry[],
) => {
  if (byesNeeded <= 0) {
    return []
  }

  const matchesPlayedMap = new Map(standings.map((entry) => [entry.playerId, entry.matchesPlayed]))
  const byesMap = new Map(standings.map((entry) => [entry.playerId, entry.byes]))

  return [...orderedPlayerIds]
    .sort((left, right) => {
      const leftMatches = matchesPlayedMap.get(left) ?? 0
      const rightMatches = matchesPlayedMap.get(right) ?? 0

      if (leftMatches !== rightMatches) {
        return leftMatches - rightMatches
      }

      const leftByes = byesMap.get(left) ?? 0
      const rightByes = byesMap.get(right) ?? 0

      if (leftByes !== rightByes) {
        return leftByes - rightByes
      }

      const recentLeft = matches.findLast((match) =>
        [...match.teamLeft, ...match.teamRight].includes(left),
      )
      const recentRight = matches.findLast((match) =>
        [...match.teamLeft, ...match.teamRight].includes(right),
      )

      return (recentLeft?.round ?? 0) - (recentRight?.round ?? 0)
    })
    .slice(0, byesNeeded)
}

const buildRandomRounds = (
  playerIds: string[],
  config: TournamentConfig,
  existingMatches: Match[] = [],
  standings: StandingEntry[] = [],
) => {
  const { partnerHistory, opponentHistory } = buildHistoryMaps(existingMatches)

  const matches: Match[] = []
  const warnings: string[] = []

  for (let roundIndex = 0; roundIndex < config.rounds; roundIndex += 1) {
    const byeCount = playerIds.length % 4
    const orderedPlayers = shuffle(playerIds)
    const byes = new Set(
      chooseByePlayers(orderedPlayers, byeCount, [...existingMatches, ...matches], standings),
    )
    const activePlayers = shuffle(orderedPlayers.filter((playerId) => !byes.has(playerId)))
    const quartets = chunk(activePlayers, 4) as Quartet[]

    quartets.forEach((quartet, index) => {
      if (quartet.length < 4) {
        return
      }

      const best = chooseBestTeamingForQuartet(quartet, partnerHistory, opponentHistory)

      matches.push(
        createMatch(roundIndex + 1, index + 1, best.teamLeft, best.teamRight, config.pointsPerMatch),
      )
      registerMatchHistory(best.teamLeft, best.teamRight, partnerHistory, opponentHistory)
    })
  }

  if (playerIds.length % 4 !== 0) {
    warnings.push(
      `Ada ${playerIds.length % 4} pemain bye di setiap ronde. Sistem memilih bye secara bergilir supaya tetap adil.`,
    )
  }

  const limitedMatches = applyCourtCapacity(matches, config.courts)

  if (config.courts < Math.floor(playerIds.length / 4)) {
    warnings.push(
      'Jumlah court membatasi match serentak, sehingga ronde random dibagi ke beberapa wave.',
    )
  }

  return { matches: limitedMatches, warnings }
}

const buildMixAmericanoMatches = (players: Player[], config: TournamentConfig) => {
  const men = shuffle(players.filter((player) => player.gender === 'male').map((player) => player.id))
  const women = shuffle(players.filter((player) => player.gender === 'female').map((player) => player.id))

  if (men.length !== women.length || men.length === 0 || players.length % 4 !== 0) {
    return {
      matches: [],
      warnings: [
        'Mode mix butuh jumlah male dan female seimbang, serta total pemain kelipatan 4.',
      ],
    }
  }

  const rounds = Math.min(config.rounds, women.length)
  const matches: Match[] = []

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    const teams = men.map((maleId, index) => [maleId, women[(index + roundIndex) % women.length]] as Pair)
    const rotatedTeams = rotate(teams, roundIndex)

    chunk(rotatedTeams, 2).forEach(([leftTeam, rightTeam], index) => {
      if (!leftTeam || !rightTeam) {
        return
      }

      matches.push(createMatch(roundIndex + 1, index + 1, leftTeam, rightTeam, config.pointsPerMatch))
    })
  }

  const limitedMatches = applyCourtCapacity(matches, config.courts)

  return {
    matches: limitedMatches,
    warnings:
      config.rounds > women.length
        ? [`Mix partner natural berhenti di ${women.length} ronde agar partner tidak berulang.`]
        : config.courts < players.length / 4
          ? ['Jumlah court lebih sedikit dari kebutuhan serentak, jadi ronde mix dibagi ke beberapa wave.']
          : [],
  }
}

const getRankingOrder = (players: Player[], matches: Match[]) => {
  const standings = buildStandings(players, matches)

  if (standings.every((entry) => entry.matchesPlayed === 0)) {
    return {
      standings,
      orderedPlayerIds: shuffle(players.map((player) => player.id)),
    }
  }

  return {
    standings,
    orderedPlayerIds: standings.map((entry) => entry.playerId),
  }
}

const buildMexicanoRound = (
  players: Player[],
  config: TournamentConfig,
  existingMatches: Match[],
): GeneratorResult => {
  const { standings, orderedPlayerIds } = getRankingOrder(players, existingMatches)
  const { partnerHistory, opponentHistory } = buildHistoryMaps(existingMatches)
  const round = Math.max(0, ...existingMatches.map((match) => match.round)) + 1
  const maxActivePlayers = Math.max(4, Math.min(players.length, config.courts * 4))
  const roundedActivePlayers = maxActivePlayers - (maxActivePlayers % 4)
  const byeCount = players.length - roundedActivePlayers
  const warnings: string[] = []
  const byes = new Set(chooseByePlayers(orderedPlayerIds, byeCount, existingMatches, standings))
  const activePlayerIds = orderedPlayerIds.filter((playerId) => !byes.has(playerId))
  const matches: Match[] = []

  if (config.partnerMode === 'mix') {
    const men = activePlayerIds.filter(
      (playerId) => players.find((player) => player.id === playerId)?.gender === 'male',
    )
    const women = activePlayerIds.filter(
      (playerId) => players.find((player) => player.id === playerId)?.gender === 'female',
    )

    if (men.length !== women.length || men.length === 0) {
      return {
        matches: [],
        warnings: ['Mexicano mix butuh jumlah male dan female aktif yang seimbang di ronde ini.'],
      }
    }

    const teams = men.map((maleId, index) => [maleId, women[index]] as Pair)

    chunk(teams, 2).forEach(([teamLeft, teamRight], index) => {
      if (!teamLeft || !teamRight) {
        return
      }

      matches.push(createMatch(round, index + 1, teamLeft, teamRight, config.pointsPerMatch))
    })
  } else {
    const quartets = chunk(activePlayerIds, 4) as Quartet[]

    quartets.forEach((quartet, index) => {
      if (quartet.length < 4) {
        return
      }

      if (config.partnerMode === 'balanced') {
        const [first, second, third, fourth] = quartet
        matches.push(
          createMatch(
            round,
            index + 1,
            [first, fourth],
            [second, third],
            config.pointsPerMatch,
          ),
        )
        return
      }

      const best = chooseBestTeamingForQuartet(
        shuffle(quartet) as Quartet,
        partnerHistory,
        opponentHistory,
      )
      matches.push(createMatch(round, index + 1, best.teamLeft, best.teamRight, config.pointsPerMatch))
      registerMatchHistory(best.teamLeft, best.teamRight, partnerHistory, opponentHistory)
    })
  }

  if (byeCount > 0) {
    warnings.push(
      `${byeCount} pemain mendapat bye di ronde ${round}. Pemilihan bye dirotasi berdasarkan jumlah match yang sudah dimainkan.`,
    )
  }

  return { matches, warnings }
}

export const validateGeneratorInput = (players: Player[], config: TournamentConfig) => {
  const warnings: string[] = []

  if (players.length < 4) {
    warnings.push('Minimal butuh 4 pemain untuk membuat pertandingan padel.')
  }

  if (config.courts < 1) {
    warnings.push('Minimal harus ada 1 court.')
  }

  if (config.partnerMode === 'mix') {
    const men = players.filter((player) => player.gender === 'male').length
    const women = players.filter((player) => player.gender === 'female').length

    if (men !== women) {
      warnings.push('Mode mix memerlukan jumlah male dan female yang seimbang.')
    }
  }

  return warnings
}

export const generateTournament = (players: Player[], config: TournamentConfig): GeneratorResult => {
  if (config.format === 'mexicano') {
    return buildMexicanoRound(players, config, [])
  }

  if (config.partnerMode === 'mix') {
    return buildMixAmericanoMatches(players, config)
  }

  if (config.partnerMode === 'balanced') {
    return buildAmericanoBalancedMatches(players.map((player) => player.id), config)
  }

  return buildRandomRounds(players.map((player) => player.id), config)
}

export const generateNextMexicanoRound = (
  players: Player[],
  config: TournamentConfig,
  existingMatches: Match[],
) => buildMexicanoRound(players, config, existingMatches)

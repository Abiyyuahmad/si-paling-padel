export type TournamentFormat = 'americano' | 'mexicano'
export type PartnerMode = 'balanced' | 'random' | 'mix'
export type Gender = 'male' | 'female' | 'unknown'
export type Side = 'left' | 'right'

export interface Player {
  id: string
  name: string
  gender: Gender
}

export interface TournamentConfig {
  title: string
  format: TournamentFormat
  partnerMode: PartnerMode
  pointsPerMatch: number
  courts: number
  rounds: number
}

export interface Match {
  id: string
  round: number
  court: number
  teamLeft: [string, string]
  teamRight: [string, string]
  pointsTarget: number
  pointLog: Side[]
  createdAt: string
}

export interface StandingEntry {
  playerId: string
  playerName: string
  gender: Gender
  rank: number
  totalPoints: number
  pointsAgainst: number
  pointDiff: number
  wins: number
  losses: number
  matchesPlayed: number
  byes: number
}

export interface GeneratorResult {
  matches: Match[]
  warnings: string[]
}

export interface TournamentState {
  config: TournamentConfig
  players: Player[]
  matches: Match[]
  notices: string[]
}

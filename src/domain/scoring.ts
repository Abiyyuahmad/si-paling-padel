import type { Match, Side } from './types'

export interface MatchScore {
  left: number
  right: number
  total: number
}

export const getMatchScore = (match: Match): MatchScore => {
  const left = match.pointLog.filter((point) => point === 'left').length
  const right = match.pointLog.length - left

  return {
    left,
    right,
    total: match.pointLog.length,
  }
}

export const isMatchComplete = (match: Match) =>
  getMatchScore(match).total >= match.pointsTarget

export const addPointToMatch = (match: Match, side: Side): Match => {
  if (isMatchComplete(match)) {
    return match
  }

  return {
    ...match,
    pointLog: [...match.pointLog, side],
  }
}

export const undoPoint = (match: Match): Match => ({
  ...match,
  pointLog: match.pointLog.slice(0, -1),
})

export const resetMatch = (match: Match): Match => ({
  ...match,
  pointLog: [],
})

export const setMatchScore = (match: Match, left: number, right: number): Match => {
  const safeLeft = Math.max(0, Math.floor(left))
  const safeRight = Math.max(0, Math.floor(right))
  const total = Math.min(safeLeft + safeRight, match.pointsTarget)
  const adjustedLeft = Math.min(safeLeft, total)
  const adjustedRight = total - adjustedLeft

  return {
    ...match,
    pointLog: [
      ...Array.from({ length: adjustedLeft }, () => 'left' as const),
      ...Array.from({ length: adjustedRight }, () => 'right' as const),
    ],
  }
}

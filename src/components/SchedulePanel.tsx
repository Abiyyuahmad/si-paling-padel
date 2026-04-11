import { useState } from 'react'

import {
  addPointToMatch,
  getMatchScore,
  isMatchComplete,
  resetMatch,
  setMatchScore,
  undoPoint,
} from '../domain/scoring'
import type { Match, Player, TournamentFormat } from '../domain/types'

interface SchedulePanelProps {
  matches: Match[]
  players: Player[]
  format: TournamentFormat
  onChangeMatch: (matchId: string, nextMatch: Match) => void
}

interface ManualScoreEditorProps {
  match: Match
  leftScore: number
  rightScore: number
  onSave: (match: Match) => void
}

const getPlayerName = (players: Player[], playerId: string) =>
  players.find((player) => player.id === playerId)?.name ?? 'Unknown'

function ManualScoreEditor({ match, leftScore, rightScore, onSave }: ManualScoreEditorProps) {
  const [leftDraft, setLeftDraft] = useState(leftScore.toString())
  const [rightDraft, setRightDraft] = useState(rightScore.toString())
  const manualLeft = Number(leftDraft || '0')
  const manualRight = Number(rightDraft || '0')
  const isManualValid =
    Number.isInteger(manualLeft) &&
    Number.isInteger(manualRight) &&
    manualLeft >= 0 &&
    manualRight >= 0 &&
    manualLeft + manualRight <= match.pointsTarget

  return (
    <div className="manual-score-box">
      <div className="manual-score-grid">
        <label className="field">
          <span>Skor kiri manual</span>
          <input
            type="number"
            min={0}
            max={match.pointsTarget}
            inputMode="numeric"
            value={leftDraft}
            onChange={(event) => setLeftDraft(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Skor kanan manual</span>
          <input
            type="number"
            min={0}
            max={match.pointsTarget}
            inputMode="numeric"
            value={rightDraft}
            onChange={(event) => setRightDraft(event.target.value)}
          />
        </label>
      </div>

      <div className="action-row">
        <button
          className="button button-secondary"
          disabled={!isManualValid}
          onClick={() => onSave(setMatchScore(match, manualLeft, manualRight))}
        >
          Simpan skor manual
        </button>
        <span className={`manual-score-note ${isManualValid ? '' : 'manual-score-note-error'}`}>
          {isManualValid
            ? `Total manual ${manualLeft + manualRight}/${match.pointsTarget} poin`
            : `Total poin tidak boleh lebih dari ${match.pointsTarget}`}
        </span>
      </div>
    </div>
  )
}

export function SchedulePanel({
  matches,
  players,
  format,
  onChangeMatch,
}: SchedulePanelProps) {
  const rounds = [...new Set(matches.map((match) => match.round))].sort((left, right) => left - right)

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live score</p>
          <h2>Pertandingan & input skor</h2>
        </div>
        <span className="chip">{format.toUpperCase()}</span>
      </div>

      {matches.length === 0 ? (
        <p className="empty-state">
          Jadwal belum dibuat. Atur pemain dan klik generate untuk mulai.
        </p>
      ) : (
        <div className="round-stack">
          {rounds.map((round) => (
            <section className="round-panel" key={round}>
              <div className="round-header">
                <span className="chip chip-muted">Ronde {round}</span>
              </div>

              <div className="match-grid">
                {matches
                  .filter((match) => match.round === round)
                  .map((match) => {
                    const score = getMatchScore(match)
                    const complete = isMatchComplete(match)

                    return (
                      <article className="match-card" key={match.id}>
                        <div className="match-meta">
                          <span>Court {match.court}</span>
                          <span>
                            {score.total}/{match.pointsTarget} poin
                          </span>
                        </div>

                        <div className="scoreboard">
                          <div className="team-side">
                            <p className="team-label">
                              {getPlayerName(players, match.teamLeft[0])} /{' '}
                              {getPlayerName(players, match.teamLeft[1])}
                            </p>
                            <strong>{score.left}</strong>
                            <button
                              className="button button-score"
                              disabled={complete}
                              onClick={() => onChangeMatch(match.id, addPointToMatch(match, 'left'))}
                            >
                              + poin kiri
                            </button>
                          </div>

                          <div className="score-divider">
                            <span>VS</span>
                            {complete ? <span className="chip chip-success">Selesai</span> : null}
                          </div>

                          <div className="team-side">
                            <p className="team-label">
                              {getPlayerName(players, match.teamRight[0])} /{' '}
                              {getPlayerName(players, match.teamRight[1])}
                            </p>
                            <strong>{score.right}</strong>
                            <button
                              className="button button-score"
                              disabled={complete}
                              onClick={() => onChangeMatch(match.id, addPointToMatch(match, 'right'))}
                            >
                              + poin kanan
                            </button>
                          </div>
                        </div>

                        <div className="action-row">
                          <button
                            className="button button-secondary"
                            disabled={match.pointLog.length === 0}
                            onClick={() => onChangeMatch(match.id, undoPoint(match))}
                          >
                            Undo poin terakhir
                          </button>
                          <button
                            className="button button-ghost"
                            disabled={match.pointLog.length === 0}
                            onClick={() => onChangeMatch(match.id, resetMatch(match))}
                          >
                            Reset match
                          </button>
                        </div>

                        <ManualScoreEditor
                          key={`${match.id}-${score.left}-${score.right}`}
                          match={match}
                          leftScore={score.left}
                          rightScore={score.right}
                          onSave={(nextMatch) => onChangeMatch(match.id, nextMatch)}
                        />

                        <div className="point-log">
                          {match.pointLog.length === 0 ? (
                            <span className="empty-mini">Belum ada detail poin.</span>
                          ) : (
                            match.pointLog.map((point, index) => (
                              <span
                                className={`point-pill ${point === 'left' ? 'point-left' : 'point-right'}`}
                                key={`${match.id}-${index}`}
                              >
                                {index + 1}. {point === 'left' ? 'Kiri' : 'Kanan'}
                              </span>
                            ))
                          )}
                        </div>
                      </article>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

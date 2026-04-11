import { startTransition, useMemo } from 'react'

import './App.css'
import { PlayersPanel } from './components/PlayersPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { SetupPanel } from './components/SetupPanel'
import { StandingsPanel } from './components/StandingsPanel'
import { generateNextMexicanoRound, generateTournament, validateGeneratorInput } from './domain/scheduler'
import { resetMatch, isMatchComplete } from './domain/scoring'
import { buildStandings } from './domain/standings'
import type { Match, TournamentState } from './domain/types'
import { useLocalStorage } from './hooks/useLocalStorage'

const STORAGE_KEY = 'padel-pwa-state'

const defaultState: TournamentState = {
  config: {
    title: 'Padel Score Hub',
    format: 'americano',
    partnerMode: 'balanced',
    pointsPerMatch: 24,
    courts: 2,
    rounds: 7,
  },
  players: [],
  matches: [],
  notices: [],
}

function App() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, defaultState)
  const standings = useMemo(
    () => buildStandings(state.players, state.matches),
    [state.matches, state.players],
  )
  const validationWarnings = useMemo(
    () => validateGeneratorInput(state.players, state.config),
    [state.config, state.players],
  )
  const maxRound = Math.max(0, ...state.matches.map((match) => match.round))
  const completedLastRound =
    state.matches.length === 0 ||
    state.matches
      .filter((match) => match.round === maxRound)
      .every((match) => isMatchComplete(match))

  const handleGenerateTournament = () => {
    startTransition(() => {
      const result = generateTournament(state.players, state.config)

      setState({
        ...state,
        matches: result.matches,
        notices: [...validationWarnings, ...result.warnings],
      })
    })
  }

  const handleGenerateNextMexicanoRound = () => {
    if (state.config.format !== 'mexicano') {
      return
    }

    startTransition(() => {
      const result = generateNextMexicanoRound(state.players, state.config, state.matches)

      setState({
        ...state,
        matches: [...state.matches, ...result.matches],
        notices: [...validationWarnings, ...result.warnings],
      })
    })
  }

  const updateMatch = (matchId: string, nextMatch: Match) => {
    setState({
      ...state,
      matches: state.matches.map((match) => (match.id === matchId ? nextMatch : match)),
    })
  }

  const overviewStats = [
    { label: 'Pemain', value: state.players.length.toString() },
    { label: 'Match', value: state.matches.length.toString() },
    { label: 'Leader', value: standings[0]?.playerName ?? '-' },
    {
      label: 'Status',
      value:
        state.matches.length > 0 && state.matches.every((match) => isMatchComplete(match))
          ? 'Selesai'
          : 'Live',
    },
  ]

  return (
    <div className="app-shell">
      <header className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">PWA untuk HP</p>
          <h1>Padel scoreboard untuk Americano dan Mexicano</h1>
          <p className="hero-text">
            Generate pairing, input poin kiri dan kanan per pertandingan, lalu lihat klasemen live
            tanpa keluar dari browser.
          </p>
        </div>

        <div className="hero-badges">
          {overviewStats.map((item) => (
            <article className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </header>

      {(validationWarnings.length > 0 || state.notices.length > 0) && (
        <section className="notice-stack">
          {[...new Set([...validationWarnings, ...state.notices])].map((notice) => (
            <p className="notice-card" key={notice}>
              {notice}
            </p>
          ))}
        </section>
      )}

      <main className="content-grid">
        <div className="stack">
          <SetupPanel
            config={state.config}
            playerCount={state.players.length}
            onChange={(config) => setState({ ...state, config, notices: [] })}
            onGenerate={handleGenerateTournament}
            onGenerateNextRound={handleGenerateNextMexicanoRound}
            onResetTournament={() =>
              setState({
                ...state,
                matches: state.matches.map((match) => resetMatch(match)),
              })
            }
            canGenerate={validationWarnings.length === 0}
            canGenerateNextRound={
              state.config.format === 'mexicano' &&
              state.players.length >= 4 &&
              completedLastRound &&
              state.matches.length > 0
            }
          />

          <PlayersPanel
            players={state.players}
            onChange={(players) =>
              setState({
                ...state,
                players,
                notices: [],
              })
            }
          />
        </div>

        <div className="stack stack-wide">
          <SchedulePanel
            format={state.config.format}
            matches={state.matches}
            players={state.players}
            onChangeMatch={updateMatch}
          />
          <StandingsPanel standings={standings} />
        </div>
      </main>
    </div>
  )
}

export default App

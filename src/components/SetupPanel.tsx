import { useState } from 'react'

import type { TournamentConfig } from '../domain/types'

interface SetupPanelProps {
  config: TournamentConfig
  playerCount: number
  onChange: (nextConfig: TournamentConfig) => void
  onGenerate: () => void
  onGenerateNextRound: () => void
  onResetTournament: () => void
  canGenerate: boolean
  canGenerateNextRound: boolean
  hasStarted: boolean
}

interface DraftNumberInputProps {
  value: number
  min: number
  max: number
  step?: number
  onCommit: (value: number) => void
}

function DraftNumberInput({ value, min, max, step, onCommit }: DraftNumberInputProps) {
  const [draft, setDraft] = useState(value.toString())

  const commitNumber = (rawValue: string) => {
    if (rawValue.trim() === '') {
      setDraft(value.toString())
      return
    }

    const parsed = Number(rawValue)

    if (!Number.isFinite(parsed)) {
      setDraft(value.toString())
      return
    }

    const safeValue = Math.min(max, Math.max(min, Math.floor(parsed)))
    onCommit(safeValue)
    setDraft(safeValue.toString())
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      inputMode="numeric"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commitNumber(draft)}
    />
  )
}

export function SetupPanel({
  config,
  playerCount,
  onChange,
  onGenerate,
  onGenerateNextRound,
  onResetTournament,
  canGenerate,
  canGenerateNextRound,
  hasStarted,
}: SetupPanelProps) {
  const update = <K extends keyof TournamentConfig>(key: K, value: TournamentConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    })
  }

  const generateLabel =
    config.format === 'mexicano' ? 'Generate turnamen Mexicano' : 'Generate turnamen Americano'

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Turnamen</p>
          <h2>Setup pertandingan</h2>
        </div>
        <span className="chip chip-highlight">{playerCount} pemain</span>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Judul event</span>
          <input
            value={config.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Americano Jumat Malam"
          />
        </label>

        <label className="field">
          <span>Format</span>
          <select
            value={config.format}
            onChange={(event) => update('format', event.target.value as TournamentConfig['format'])}
          >
            <option value="americano">Americano</option>
            <option value="mexicano">Mexicano</option>
          </select>
        </label>

        <label className="field">
          <span>Partner</span>
          <select
            value={config.partnerMode}
            onChange={(event) =>
              update('partnerMode', event.target.value as TournamentConfig['partnerMode'])
            }
          >
            <option value="balanced">Balanced</option>
            <option value="random">Random</option>
            <option value="mix">Mix partner</option>
          </select>
        </label>

        <label className="field">
          <span>Poin per pertandingan</span>
          <DraftNumberInput
            key={`points-${config.pointsPerMatch}`}
            value={config.pointsPerMatch}
            min={8}
            max={64}
            step={4}
            onCommit={(value) => update('pointsPerMatch', value)}
          />
        </label>

        <label className="field">
          <span>Jumlah court</span>
          <DraftNumberInput
            key={`courts-${config.courts}`}
            value={config.courts}
            min={1}
            max={16}
            onCommit={(value) => update('courts', value)}
          />
        </label>

        <label className="field">
          <span>Ronde target</span>
          <DraftNumberInput
            key={`rounds-${config.rounds}`}
            value={config.rounds}
            min={1}
            max={50}
            onCommit={(value) => update('rounds', value)}
          />
        </label>
      </div>

      <div className="action-row">
        {!hasStarted ? (
          <button className="button button-primary button-cta" disabled={!canGenerate} onClick={onGenerate}>
            {generateLabel}
          </button>
        ) : null}

        {hasStarted && config.format === 'mexicano' ? (
          <button
            className="button button-primary button-cta"
            disabled={!canGenerateNextRound}
            onClick={onGenerateNextRound}
          >
            Generate ronde Mexicano
          </button>
        ) : null}

        {hasStarted ? (
          <button className="button button-ghost" onClick={onResetTournament}>
            Reset turnamen
          </button>
        ) : null}
      </div>
    </section>
  )
}

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
}: SetupPanelProps) {
  const update = <K extends keyof TournamentConfig>(key: K, value: TournamentConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    })
  }

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
          <input
            type="number"
            min={8}
            max={64}
            step={4}
            value={config.pointsPerMatch}
            onChange={(event) => update('pointsPerMatch', Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>Jumlah court</span>
          <input
            type="number"
            min={1}
            max={16}
            value={config.courts}
            onChange={(event) => update('courts', Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>Ronde target</span>
          <input
            type="number"
            min={1}
            max={50}
            value={config.rounds}
            onChange={(event) => update('rounds', Number(event.target.value))}
          />
        </label>
      </div>

      <div className="action-row">
        <button className="button button-primary" disabled={!canGenerate} onClick={onGenerate}>
          Generate turnamen
        </button>
        <button
          className="button button-secondary"
          disabled={!canGenerateNextRound}
          onClick={onGenerateNextRound}
        >
          Generate ronde Mexicano
        </button>
        <button className="button button-ghost" onClick={onResetTournament}>
          Reset semua skor
        </button>
      </div>
    </section>
  )
}

import type { StandingEntry } from '../domain/types'

interface StandingsPanelProps {
  standings: StandingEntry[]
}

export function StandingsPanel({ standings }: StandingsPanelProps) {
  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Klasemen</p>
          <h2>Hasil akhir sementara</h2>
        </div>
      </div>

      {standings.length === 0 ? (
        <p className="empty-state">Belum ada pemain untuk dihitung klasemennya.</p>
      ) : (
        <div className="table-wrap">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pemain</th>
                <th>Poin</th>
                <th>Win</th>
                <th>Diff</th>
                <th>Main</th>
                <th>Bye</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => (
                <tr key={entry.playerId}>
                  <td>{entry.rank}</td>
                  <td>{entry.playerName}</td>
                  <td>{entry.totalPoints}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.pointDiff}</td>
                  <td>{entry.matchesPlayed}</td>
                  <td>{entry.byes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

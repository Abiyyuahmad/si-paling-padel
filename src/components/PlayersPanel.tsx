import { useState } from 'react'

import type { Gender, Player } from '../domain/types'
import { createId } from '../domain/utils'

interface PlayersPanelProps {
  players: Player[]
  onChange: (players: Player[]) => void
}

const SAMPLE_PLAYERS = [
  ['Raka', 'male'],
  ['Bima', 'male'],
  ['Arga', 'male'],
  ['Yoga', 'male'],
  ['Sinta', 'female'],
  ['Tari', 'female'],
  ['Dina', 'female'],
  ['Nadia', 'female'],
] as const satisfies readonly [string, Gender][]

export function PlayersPanel({ players, onChange }: PlayersPanelProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('unknown')
  const [bulkText, setBulkText] = useState('')

  const addPlayer = () => {
    if (!name.trim()) {
      return
    }

    onChange([
      ...players,
      {
        id: createId(),
        name: name.trim(),
        gender,
      },
    ])
    setName('')
    setGender('unknown')
  }

  const importBulk = () => {
    const importedPlayers = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawName, rawGender] = line.split(/[|,]/).map((item) => item.trim())
        const normalizedGender =
          rawGender === 'male' || rawGender === 'female' ? rawGender : 'unknown'

        return {
          id: createId(),
          name: rawName,
          gender: normalizedGender,
        } satisfies Player
      })

    if (importedPlayers.length === 0) {
      return
    }

    onChange([...players, ...importedPlayers])
    setBulkText('')
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Pemain</p>
          <h2>Roster turnamen</h2>
        </div>
        <div className="inline-actions">
          <button
            className="button button-secondary"
            onClick={() =>
              onChange(
                SAMPLE_PLAYERS.map(([sampleName, sampleGender]) => ({
                  id: createId(),
                  name: sampleName,
                  gender: sampleGender,
                })),
              )
            }
          >
            Muat contoh 8 pemain
          </button>
          <button className="button button-ghost" onClick={() => onChange([])}>
            Kosongkan
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nama pemain</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Andi"
          />
        </label>

        <label className="field">
          <span>Gender</span>
          <select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
      </div>

      <div className="action-row">
        <button className="button button-primary" onClick={addPlayer}>
          Tambah pemain
        </button>
      </div>

      <label className="field">
        <span>Import cepat</span>
        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder={`Budi|male\nSari|female\nReno`}
          rows={5}
        />
      </label>

      <div className="action-row">
        <button className="button button-secondary" onClick={importBulk}>
          Import daftar
        </button>
      </div>

      <div className="player-list">
        {players.length === 0 ? (
          <p className="empty-state">Belum ada pemain. Tambahkan manual atau import daftar.</p>
        ) : (
          players.map((player, index) => (
            <article className="player-card" key={player.id}>
              <span className="player-index">{index + 1}</span>
              <input
                value={player.name}
                onChange={(event) =>
                  onChange(
                    players.map((item) =>
                      item.id === player.id ? { ...item, name: event.target.value } : item,
                    ),
                  )
                }
              />
              <select
                value={player.gender}
                onChange={(event) =>
                  onChange(
                    players.map((item) =>
                      item.id === player.id
                        ? { ...item, gender: event.target.value as Gender }
                        : item,
                    ),
                  )
                }
              >
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <button
                className="button button-danger"
                onClick={() => onChange(players.filter((item) => item.id !== player.id))}
              >
                Hapus
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import Header from '../components/Header'
import { getPublicUser } from '../services/userService'
import '../App.css'

function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    getPublicUser(user.id)
      .then((data) => {
        setProfile(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Hiba a profil lekérésekor')
      })
  }, [user])

  if (!user) {
    // elvileg RequireAuth miatt ide nem nagyon jutunk,
    // de legyen biztonság kedvéért egy üres visszatérés
    return null
  }

  return (
    <>
      <Header title="Arcade Mania" />

      <main className="arcade-main">
        <h2 className="screen-title">Your profil</h2>

        {error && (
          <div className="error-text">
            {error}
          </div>
        )}

        {profile && (
          <div className="profile-page-wrapper">
            <div className="profile-main-card">
              {/* Felhasználónév blokk */}
              <div className="profile-card-section">
                <div className="profile-label">Username:</div>
                <div className="profile-value">{profile.name}</div>
              </div>

              {/* Pontszámok blokk – ugyanaz a „táblázat”, mint a leaderboard kártyákon */}
              <div className="profile-card-section">

                <div className="score-table">
                  <div className="score-row header">
                    <span>Game</span>
                    <span>High&nbsp;Score</span>
                  </div>

                  {(profile.scores || []).map((s) => (
                    <div key={s.gameId} className="score-row">
                      <span>{s.gameName}</span>
                      <span>{s.highScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default Profile

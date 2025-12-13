// src/components/Header.jsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import '../App.css'

function Header({
  title = 'Arcade Mania',
  muted = false,
  toggleMute = () => {},
  rightLabel,
  rightTo
}) {
  const location = useLocation()
  const auth = useAuth()
  const navigate = useNavigate()

  const handleRight = () => {
    if (rightTo) navigate(rightTo)
  }

  const handleLogout = () => {
    auth && auth.logout && auth.logout()
    navigate('/login')
  }

  // Ha be vagyunk jelentkezve, akkor saját menülogika
  let menuItems = []

  if (auth && auth.user) {
    const path = location.pathname

    if (path === '/') {
      // Main-en: csak Profil + Leaderboard kattintható
      menuItems = [
        { label: 'Profil', to: '/profile' },
        { label: 'Leaderboard', to: '/leaderboard' },
        { label: 'Logout', action: handleLogout }
      ]
    } else if (path === '/profile') {
      // Profilon: Main + Leaderboard
      menuItems = [
        { label: 'Leaderboard', to: '/leaderboard' },
        { label: 'Logout', action: handleLogout }
      ]
    } else if (path === '/leaderboard') {
      // Leaderboardon: Main + Profil
      menuItems = [
        { label: 'Profil', to: '/profile' },
        { label: 'Logout', action: handleLogout }
      ]
    } else {
      // Egyéb védett oldalakon – fallback
      menuItems = [
        { label: 'Profil', to: '/profile' },
        { label: 'Leaderboard', to: '/leaderboard' },
        { label: 'Logout', action: handleLogout }
      ]
    }
  }

  return (
    <>
      <div className="side-bar left" />
      <div className="side-bar right" />

      <header className="arcade-header">
        <div>
          <button
            className="mute-btn"
            onClick={toggleMute}
            title="Mute/Unmute"
          >
            {muted ? '❌' : '🎵'}
          </button>
        </div>

        <div className="arcade-title">{title}</div>

        <div className="header-actions">
          {/* Ha NINCS bejelentkezett user (login / register), akkor a régi jobb felső gomb */}
          {!auth?.user ? (
            rightLabel ? (
              <button className="header-action-btn" onClick={handleRight}>
                {rightLabel}
              </button>
            ) : null
          ) : (
            // Ha VAN user → menü
            <div className="dropdown">
              <button className="dropdown-btn">☰</button>
              <div className="dropdown-content">
                {menuItems.map((item, idx) => (
                  <a
                    key={idx}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (item.to) navigate(item.to)
                      if (item.action) item.action()
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}

export default Header

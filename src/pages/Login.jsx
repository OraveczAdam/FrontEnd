import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import * as authService from '../services/authService'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()

  // Ha a RequireAuth dobott ide, onnan megyünk vissza login után
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setMessage(null)

    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      setMessage({ type: 'error', text: 'Felhasználónév és jelszó megadása kötelező.' })
      return
    }

    setLoading(true)

    try {
      const user = await authService.login(cleanUsername, cleanPassword)
      auth.login(user)

      setMessage({ type: 'success', text: 'Sikeres bejelentkezés...' })

      // Kis késleltetés UX miatt (opcionális)
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Hibás felhasználónév vagy jelszó.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <main style={{ textAlign: 'center', marginTop: 100, padding: 20 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', cursive" }}>
          Bejelentkezés
        </h2>

        <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
          <input
            placeholder="Felhasználónév"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />

          <input
            placeholder="Jelszó"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Bejelentkezés…' : 'Bejelentkezés'}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: 12,
              color: message.type === 'error' ? 'salmon' : 'lightgreen'
            }}
          >
            {message.text}
          </div>
        )}
      </main>
    </div>
  )
}

export default Login

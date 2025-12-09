import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/authService'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Use the authService abstraction so switching to a real API is easy:
    // authService.register will either call your backend (when configured) or use the local mock.
    authService.register(username, password)
      .then(() => {
        setMessage({ type: 'success', text: 'Regisztráció sikeres — most bejelentkezhetsz' })
        setUsername('')
        setPassword('')
        setTimeout(() => navigate('/login'), 800)
      })
      .catch((err) => {
        setMessage({ type: 'error', text: err.message || 'Hiba a regisztráció során' })
      })
  }

  return (
    <div>
      <main style={{ textAlign: 'center', marginTop: 100, padding: 20 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', cursive" }}>Regisztráció</h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
          <input
            placeholder="Felhasználónév"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            placeholder="Jelszó"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Regisztrálás</button>
        </form>

        {message && (
          <div style={{ marginTop: 12, color: message.type === 'error' ? 'salmon' : 'lightgreen' }}>
            {message.text}
          </div>
        )}
      </main>
    </div>
  )
}

export default Register

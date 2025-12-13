// src/services/gameService.js
const API_BASE = 'http://localhost:5118/api/Users'

export async function submitScore(gameName, score, userId) {
  try {
    const resp = await fetch(`${API_BASE}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName, score, userId })
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(text || 'Failed to submit score')
    }

    return true
  } catch (e) {
    console.warn('submitScore failed', e)
    return false
  }
}

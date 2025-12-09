// src/services/authService.js

// Állítsd be a saját backend URL-edet.
// Ha a Swagger pl. ezen fut: http://localhost:5118/swagger
// akkor az API_BASE így jó lesz:
const API_BASE = 'http://localhost:5118/api/Users'

/**
 * Segédfüggvény POST kérésekhez.
 * - path: pl. "/login" vagy "/register"
 * - body: a JS objektum, amit JSON-ként küldünk
 */
async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  let data
  try {
    data = await response.json()
  } catch {
    // Ha nem JSON jött vissza, de a státusz hibás, akkor is dobjunk hibát
    if (!response.ok) {
      throw new Error('Ismeretlen hiba történt a szerveren.')
    }
    // Ha ok és nincs JSON, akkor teoretikusan visszaadhatnánk null-t,
    // de a mi back-endünk mindig JSON-t küld.
    return null
  }

  if (!response.ok) {
    // A backend így válaszol: { message: "...", result: ... }
    const msg = data?.message || 'Ismeretlen hiba történt.'
    throw new Error(msg)
  }

  return data
}

/**
 * Bejelentkezés
 * 
 * Back-end endpoint:
 * POST /api/Users/login
 * Body: { "name": "<felhasználónév>", "password": "<jelszó>" }
 * Válasz (200):
 * {
 *   "message": "Sikeres bejelentkezés",
 *   "result": {
 *     "id": "...",
 *     "name": "...",
 *     "scores": [
 *       { "gameId": "...", "gameName": "Arcade Fighter", "highScore": 0 },
 *       ...
 *     ]
 *   }
 * }
 */
export async function login(username, password) {
  const payload = {
    name: username,
    password: password
  }

  const data = await postJson('/login', payload)

  // data.result a backend által visszaadott user objektum
  // Ezt fogjuk elmenteni az AuthContext-ben.
  return data.result
}

/**
 * Regisztráció
 * 
 * Back-end endpoint:
 * POST /api/Users/register
 * Body: { "name": "<felhasználónév>", "password": "<jelszó>" }
 * Válasz (201):
 * {
 *   "message": "Sikeres regisztráció",
 *   "result": {
 *     "id": "...",
 *     "name": "..."
 *   }
 * }
 */
export async function register(username, password) {
  const payload = {
    name: username,
    password: password
  }

  const data = await postJson('/register', payload)

  // Itt jelenleg nem használjuk fel a visszaadott result-ot,
  // de visszaadjuk, ha később mégis kellene valamire.
  return data.result
}

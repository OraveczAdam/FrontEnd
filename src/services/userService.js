// src/services/userService.js
const API_BASE = 'http://localhost:5118/api/Users'

// Közös helper GET + biztonságos JSON olvasásra
async function getJson(url, defaultErrorMessage) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 1) először szövegként olvassuk be
  const text = await response.text()

  if (!text) {
    // teljesen üres body
    if (!response.ok) {
      throw new Error(defaultErrorMessage)
    }
    // ha mégis OK és üres, akkor nincs mit visszaadni
    return { message: '', result: null }
  }

  // 2) próbáljuk JSON-ná alakítani
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Érvénytelen JSON válasz érkezett a szervertől.')
  }

  // 3) státusz ellenőrzés
  if (!response.ok) {
    throw new Error(data.message || defaultErrorMessage)
  }

  return data
}

// Egy user publikus adatai (profil oldal)
export async function getPublicUser(id) {
  const data = await getJson(
    `${API_BASE}/public/${id}`,
    'Hiba a profil lekérésekor'
  )

  // { name: string, scores: [ { gameId, gameName, highScore } ] }
  return data.result
}

// Összes user publikus adatai (leaderboard)
export async function getAllPublicUsers() {
  const data = await getJson(
    `${API_BASE}/public`,
    'Hiba a leaderboard lekérésekor'
  )

  // [ { name, scores: [...] }, ... ]
  return data.result
}

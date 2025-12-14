import React, { useRef, useEffect, useState } from 'react'
import './Game1.css'
import ship1Png from '../assets/aliens/ship1.png'
import enemyPng from '../assets/aliens/Enemy.png'
import asteroidPng from '../assets/aliens/Asteroid.png'
import { useNavigate } from 'react-router-dom'

export default function Game1() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const spawnRef = useRef(null)
  const runningRef = useRef(false)
  const endedRef = useRef(false)

  // game objects in refs to avoid rerenders each frame
  const playerRef = useRef({ x: 40, y: 100, w: 80, h: 80 })
  const bulletsRef = useRef([])
  const enemiesRef = useRef([])

  // UI state
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [running, setRunning] = useState(false)
  const [ended, setEnded] = useState(false)
  const navigate = useNavigate()

  // sprite images refs
  const enemyImgsRef = useRef([])
  const playerImgRef = useRef(null)

  // sizing
  function resizeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
  }

  // spawn an enemy on the right moving left
  function spawnEnemy() {
    const canvas = canvasRef.current
    if (!canvas) return
    const h = canvas.clientHeight
    const size = 36 + Math.random() * 28
    const y = Math.max(8, Math.random() * (h - size - 8))
    enemiesRef.current.push({
      x: canvas.clientWidth + 10,
      y,
      w: size,
      h: size,
      vx: - (2 + Math.random() * 3),
      hp: 1,
      // sprite: 0 = enemy ship image, 1 = asteroid
      sprite: Math.floor(Math.random() * 2)
    })
  }

  // no background image — draw a solid black playfield

  // simple AABB collision with optional padding
  function collide(a, b, pad = 0) {
    return !(
      a.x + a.w + pad < b.x - pad ||
      a.x - pad > b.x + b.w + pad ||
      a.y + a.h + pad < b.y - pad ||
      a.y - pad > b.y + b.h + pad
    )
  }

  // main update + draw loop
  function loop() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.clientWidth
    const h = canvas.clientHeight

    // update
    bulletsRef.current.forEach((b) => { b.x += b.vx })
    enemiesRef.current.forEach((e) => { e.x += e.vx })

    // collisions: bullets -> enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const e = enemiesRef.current[i]
      for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
        const b = bulletsRef.current[j]
        if (collide(e, b, 1)) {
              enemiesRef.current.splice(i, 1)
              bulletsRef.current.splice(j, 1)
              // update ref + state so the animation loop sees latest value
              scoreRef.current = (scoreRef.current || 0) + 1
              setScore(scoreRef.current)
              break
            }
      }
    }

    // enemies hitting player -> game over
    const player = playerRef.current
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const e = enemiesRef.current[i]
      if (collide(e, player)) {
        // end game
        stopGame()
        setEnded(true)
        endedRef.current = true
        return
      }
    }

    // remove offscreen bullets/enemies
    bulletsRef.current = bulletsRef.current.filter(b => b.x < w + 50)
    enemiesRef.current = enemiesRef.current.filter(e => e.x + e.w > -50)

    // draw
    ctx.clearRect(0, 0, w, h)

    // player sprite (processed PNG or SVG). draw rotated to face right
    const pImg = playerImgRef.current
    if (pImg && pImg.complete) {
      ctx.save()
      const cx = player.x + player.w / 2
      const cy = player.y + player.h / 2
      ctx.translate(cx, cy)
      ctx.rotate(Math.PI / 2) // rotate 90deg clockwise
      ctx.drawImage(pImg, -player.w / 2, -player.h / 2, player.w, player.h)
      ctx.restore()
    } else {
      ctx.fillStyle = '#7cf77c'
      ctx.fillRect(player.x, player.y, player.w, player.h)
    }

    // bullets
    ctx.fillStyle = '#ffd86b'
    bulletsRef.current.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h))

    // enemies as sprites with rectangle fallback
    enemiesRef.current.forEach((e) => {
      const imgs = enemyImgsRef.current || []
      const img = imgs[e.sprite]
      if (img && img.complete) ctx.drawImage(img, e.x, e.y, e.w, e.h)
      else { ctx.fillStyle = '#ff6b6b'; ctx.fillRect(e.x, e.y, e.w, e.h) }
    })

    // HUD removed from canvas; score is shown in DOM element for consistency with Game3

    // continue
    rafRef.current = requestAnimationFrame(loop)
  }

  function startGame() {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(true)
    setEnded(false)
    endedRef.current = false
    // reset state
    bulletsRef.current = []
    enemiesRef.current = []
    playerRef.current.y = (canvasRef.current ? canvasRef.current.clientHeight / 2 : 120)
    scoreRef.current = 0
    setScore(0)
    // reset player x position
    playerRef.current.x = 40
    try {
      // helper: load image and remove white/green background in-browser
      const loadAndProcess = (src, cb) => {
        const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src
        img.onload = () => {
          try {
            const off = document.createElement('canvas')
            off.width = img.width
            off.height = img.height
            const ox = off.getContext('2d')
            ox.drawImage(img, 0, 0)
            const imgd = ox.getImageData(0, 0, off.width, off.height)
            const data = imgd.data
            const tol = 30
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2]
              // Only remove near-white background; keep greens intact
              if (r >= 255 - tol && g >= 255 - tol && b >= 255 - tol) {
                data[i + 3] = 0
              }
            }
            ox.putImageData(imgd, 0, 0)
            const proc = new Image()
            proc.onload = () => cb(proc)
            proc.src = off.toDataURL('image/png')
          } catch (err) { console.debug('process failed', err); cb(img) }
        }
        img.onerror = () => { cb(null) }
      }

      // load and process enemy and asteroid images
      loadAndProcess(enemyPng, (res) => { if (res) enemyImgsRef.current[0] = res })
      loadAndProcess(asteroidPng, (res) => { if (res) enemyImgsRef.current[1] = res })

      // svg fallbacks for enemies if PNGs not available (no SVGs used)
      const i2 = new Image()
      const i3 = new Image()
      // ensure array has entries
      if (!enemyImgsRef.current[0]) enemyImgsRef.current[0] = i2
      if (!enemyImgsRef.current[1]) enemyImgsRef.current[1] = i3

      // process player PNG as well (remove near-white background)
      loadAndProcess(ship1Png, (res) => {
        if (res) playerImgRef.current = res
        else playerImgRef.current = null
      })
    } catch (err) { console.debug('sprite preload failed', err) }
    // start spawning enemies and the render loop
    spawnRef.current = setInterval(spawnEnemy, 900)
    rafRef.current = requestAnimationFrame(loop)
  }

  function stopGame() {
    runningRef.current = false
    setRunning(false)
    if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }

  function restartGame() {
    stopGame()
    startGame()
  }

  function handleKey(e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault()
      if (endedRef.current) { restartGame(); return }
      const p = playerRef.current
      bulletsRef.current.push({ x: p.x + p.w + 4, y: p.y + p.h / 2 - 4, w: 8, h: 8, vx: 8 })
      if (!runningRef.current) startGame()
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      playerRef.current.y -= 18
      if (playerRef.current.y < 4) playerRef.current.y = 4
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      playerRef.current.y += 18
      const canvas = canvasRef.current
      if (canvas) {
        const maxY = canvas.clientHeight - playerRef.current.h - 4
        if (playerRef.current.y > maxY) playerRef.current.y = maxY
      }
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      playerRef.current.x -= 18
      const canvas = canvasRef.current
      if (canvas) {
        const minX = 4
        if (playerRef.current.x < minX) playerRef.current.x = minX
      }
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      playerRef.current.x += 18
      const canvas = canvasRef.current
      if (canvas) {
        const maxX = canvas.clientWidth - playerRef.current.w - 4
        if (playerRef.current.x > maxX) playerRef.current.x = maxX
      }
    }

    // ensure vertical clamp
    if (playerRef.current.y < 4) playerRef.current.y = 4
    if (e.key === 'r' || e.key === 'R') restartGame()
  }

  useEffect(() => {
    // preload ship sprites for player/enemies
    try {
      const i2 = new Image()
      const i3 = new Image()
      enemyImgsRef.current = [i2, i3]

      // load the PNG (user-provided) and remove white background in-browser
      const raw = new Image()
      raw.crossOrigin = 'anonymous'
      // load PNG and remove white background in-browser, producing a transparent sprite
      raw.onload = () => {
        try {
          const off = document.createElement('canvas')
          off.width = raw.width
          off.height = raw.height
          const ox = off.getContext('2d')
          ox.drawImage(raw, 0, 0)
          const imgd = ox.getImageData(0, 0, off.width, off.height)
          const data = imgd.data
          const tol = 30 // tolerance for "near-white"
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            // Only remove near-white pixels
            if (r >= 255 - tol && g >= 255 - tol && b >= 255 - tol) {
              data[i + 3] = 0
            }
          }
          ox.putImageData(imgd, 0, 0)
          const processed = new Image()
          processed.onload = () => { playerImgRef.current = processed }
          processed.src = off.toDataURL('image/png')
        } catch (err) {
          console.debug('png processing failed', err)
          playerImgRef.current = raw
        }
      }
      raw.onerror = () => {
        // no SVG fallback — leave playerImg null to use rectangle fallback
        playerImgRef.current = null
      }
      raw.src = ship1Png
    } catch (err) { console.debug('sprite preload failed', err) }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKey)
    // set the site background to black while this page is mounted
    try { document.body.classList.add('page-game1') } catch (err) { console.debug('add body class failed', err) }
    // initial draw
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    }
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', handleKey)
      try { document.body.classList.remove('page-game1') } catch (err) { console.debug('remove body class failed', err) }
      stopGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game1-page">
      <div className="game1-frame">
        <div className="frame-top" />
        <div className="score">Score: {score}</div>
        <div
          className="back"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/') }}
        >
          Back
        </div>
        <div className="game1-canvas-wrap">
          <canvas ref={canvasRef} />
          {!running && (
            <div className="game1-overlay" onClick={() => { if (endedRef.current) restartGame(); else startGame() }}>
              <div className="game1-overlay-text">{ended ? `Game Over — Score ${score}` : 'Press Space to Start'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

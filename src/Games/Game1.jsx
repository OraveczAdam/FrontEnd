import React, { useRef, useEffect, useState } from 'react'
import './Game1.css'
import { useNavigate } from 'react-router-dom'

export default function Game1() {
  // refs for canvas and mutable game state
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const spawnRef = useRef(null)
  const runningRef = useRef(false)
  const endedRef = useRef(false)

  // game objects in refs to avoid rerenders each frame
  const playerRef = useRef({ x: 40, y: 100, w: 22, h: 22 })
  const bulletsRef = useRef([])
  const enemiesRef = useRef([])

  // UI state
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [running, setRunning] = useState(false)
  const [ended, setEnded] = useState(false)
  const navigate = useNavigate()

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
    const size = 22 + Math.random() * 18
    const y = Math.max(8, Math.random() * (h - size - 8))
    enemiesRef.current.push({
      x: canvas.clientWidth + 10,
      y,
      w: size,
      h: size,
      vx: - (2 + Math.random() * 3),
      hp: 1
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

    // background: dark green to match CSS playfield
    ctx.fillStyle = '#063b1f'
    ctx.fillRect(0, 0, w, h)

    // player
    ctx.fillStyle = '#7cf77c'
    ctx.fillRect(player.x, player.y, player.w, player.h)

    // bullets
    ctx.fillStyle = '#ffd86b'
    bulletsRef.current.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h))

    // enemies
    ctx.fillStyle = '#ff6b6b'
    enemiesRef.current.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h))

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
    // spawn interval
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

  // controls: up/down to move, Space to shoot / start, R to restart
  function handleKey(e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault()
      if (endedRef.current) {
        restartGame()
        return
      }
      // shoot
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
      // clamp to bottom of canvas so player can't leave the map
      const canvas = canvasRef.current
      if (canvas) {
        const maxY = canvas.clientHeight - playerRef.current.h - 4
        if (playerRef.current.y > maxY) playerRef.current.y = maxY
      }
    }
    // ensure top clamp as well (in case of fast repeated moves)
    if (playerRef.current.y < 4) playerRef.current.y = 4
    if (e.key === 'r' || e.key === 'R') {
      restartGame()
    }
  }

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKey)
    // set the site background to black while this page is mounted
    try { document.body.classList.add('page-game1') } catch (err) { console.debug('add body class failed', err) }
    // initial draw
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#081B07'
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
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

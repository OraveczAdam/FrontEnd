import React, { useRef, useEffect, useState } from 'react'
import './Game1.css'

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
  const [running, setRunning] = useState(false)
  const [ended, setEnded] = useState(false)

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

  // simple AABB collision
  function collide(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h)
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
        if (collide(e, b)) {
          enemiesRef.current.splice(i, 1)
          bulletsRef.current.splice(j, 1)
          setScore((s) => s + 1)
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

    // background
    ctx.fillStyle = '#081B07'
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

    // HUD
    ctx.fillStyle = '#66ffcc'
    ctx.font = '14px monospace'
    ctx.fillText('Score: ' + score, 12, 18)

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
    }
    if (e.key === 'r' || e.key === 'R') {
      restartGame()
    }
  }

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKey)
    // initial draw
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#081B07'
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.fillStyle = '#66ffcc'
      ctx.font = '14px monospace'
      ctx.fillText('Press Space to start', 12, 18)
    }
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', handleKey)
      stopGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game1-page">
      <div className="game1-frame">
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

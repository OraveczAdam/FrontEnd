import React, { useRef, useEffect, useState } from 'react'
import './Game3.css'
import snakeBack from '../assets/SnakeBack.png'
import { useAuth } from '../auth/AuthProvider'
import { submitScore } from '../services/gameService'
import { useNavigate } from 'react-router-dom'

export default function Game3() {
  /**
   * Game3: Canvas-based Snake game component
   * - Renders a canvas inside an arcade frame
   * - Uses refs for mutable state (snake, direction, score) and timeouts for the loop
   * - Supports keyboard (arrows + WASD), touch swipe, mobile D-pad, and score submission
   *
   * The code below is intentionally explicit and commented so you can see what each
   * function and ref is responsible for. I removed a couple of redundant bits
   * (like an always-false `aria-hidden` expression) and cleaned up stray debug
   * comments while leaving the game logic intact.
   */
  const centerRef = useRef(null)
  const canvasRef = useRef(null)
  const loopRef = useRef(null)
  const snakeRef = useRef([])
  const dirRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 0, y: 0 })
  const colsRef = useRef(0)
  const rowsRef = useRef(0)
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [ended, setEnded] = useState(false)
  const endedRef = useRef(false)

  const CELL = 28 // bigger cells for larger snake/food
  const BASE_DELAY = 120

  const auth = useAuth()
  const navigate = useNavigate()

  const particlesRef = useRef([])
  const touchStartRef = useRef(null)
  const slowUntilRef = useRef(0)
  // particle list for simple particle effects
  // touch handling start point for swipe detection
  // used by 'slow' food to delay speed for a short period

  useEffect(() => {
    initGame()

    window.addEventListener('resize', handleResize)
    // attach to window in capture phase to ensure we receive keys before other handlers
    window.addEventListener('keydown', handleKey, true)

    // focus canvas so keyboard input works immediately
    if (canvasRef.current) {
      try {
        canvasRef.current.setAttribute('tabindex', '0')
        canvasRef.current.focus()
      } catch (err) { console.debug('canvas focus failed', err) }
    }

    return () => {
      stopLoop()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKey, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetCanvasSize() {
    const canvas = canvasRef.current
    const center = centerRef.current
    if (!canvas || !center) return

    const width = Math.max(100, center.clientWidth)
    const height = Math.max(100, center.clientHeight)
    const dpr = window.devicePixelRatio || 1

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    colsRef.current = Math.floor(width / CELL)
    rowsRef.current = Math.floor(height / CELL)
  }

  // preload background image
  const bgImageRef = useRef(null)
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      bgImageRef.current = img
      // redraw now that background is ready
      try { draw() } catch (err) { console.debug('draw after bg load failed', err) }
    }
    img.onerror = (err) => {
      console.debug('background image failed to load', err)
      // still set it so draw uses fill fallback
      bgImageRef.current = img
    }
    img.src = snakeBack
    // if cached and already complete, trigger draw immediately
    if (img.complete) {
      bgImageRef.current = img
      try { draw() } catch (err) { console.debug('draw after bg load failed', err) }
    }
  }, [])

  function spawnFood() {
    const typeRoll = Math.random()
    let type = 'normal'
    if (typeRoll > 0.92) type = 'bonus'
    else if (typeRoll > 0.84) type = 'slow'

    return {
      x: Math.floor(Math.random() * Math.max(1, colsRef.current)),
      y: Math.floor(Math.random() * Math.max(1, rowsRef.current)),
      type
    }
  }

  function initGame() {
    resetCanvasSize()
    colsRef.current = Math.max(10, colsRef.current)
    rowsRef.current = Math.max(8, rowsRef.current)
    snakeRef.current = [
      { x: Math.floor(colsRef.current / 2), y: Math.floor(rowsRef.current / 2) }
    ]
    dirRef.current = { x: 1, y: 0 }
    foodRef.current = spawnFood()
    scoreRef.current = 0
    setScore(0)
    setRunning(false)
    setEnded(false)
    endedRef.current = false
    draw()
  }

  function startLoop() {
    if (loopRef.current) return
    setRunning(true)
    scheduleNextTick()
  }

  function stopLoop() {
    if (loopRef.current) {
      clearTimeout(loopRef.current)
      loopRef.current = null
    }
    setRunning(false)
  }

  function getDelayForScore(s) {
    // decrease delay as score rises
    return Math.max(50, BASE_DELAY - s * 4)
  }

  function scheduleNextTick() {
    const now = Date.now()
    const slowPenalty = slowUntilRef.current > now ? 60 : 0
    const delay = getDelayForScore(scoreRef.current) + slowPenalty
    loopRef.current = setTimeout(() => {
      step()
      if (loopRef.current) scheduleNextTick()
    }, delay)
  }

  function handleResize() {
    // restart game cleanly on resize
    stopLoop()
    initGame()
  }

  function handleKey(e) {
    // Debug: log key events (can remove later)
    // console.debug('Game keydown:', e.key, e.code)

    // Accept Space (code or key) to start
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault()
      // If game ended, restart and immediately start playing
      if (endedRef.current) {
        try { restart() } catch (err) { console.debug('restart failed', err) }
        startLoop()
      } else if (!running) {
        startLoop()
      }
      return
    }

    // Map arrow keys and WASD (both uppercase/lowercase and codes)
    const key = e.key
    const code = e.code
    const mapUp = key === 'ArrowUp' || code === 'ArrowUp' || key === 'w' || key === 'W' || code === 'KeyW'
    const mapDown = key === 'ArrowDown' || code === 'ArrowDown' || key === 's' || key === 'S' || code === 'KeyS'
    const mapLeft = key === 'ArrowLeft' || code === 'ArrowLeft' || key === 'a' || key === 'A' || code === 'KeyA'
    const mapRight = key === 'ArrowRight' || code === 'ArrowRight' || key === 'd' || key === 'D' || code === 'KeyD'

    if (mapUp) {
      e.preventDefault()
      if (!running) startLoop()
      if (dirRef.current.y !== 1) dirRef.current = { x: 0, y: -1 }
      return
    }
    if (mapDown) {
      e.preventDefault()
      if (!running) startLoop()
      if (dirRef.current.y !== -1) dirRef.current = { x: 0, y: 1 }
      return
    }
    if (mapLeft) {
      e.preventDefault()
      if (!running) startLoop()
      if (dirRef.current.x !== 1) dirRef.current = { x: -1, y: 0 }
      return
    }
    if (mapRight) {
      e.preventDefault()
      if (!running) startLoop()
      if (dirRef.current.x !== -1) dirRef.current = { x: 1, y: 0 }
      return
    }
  }

  function changeDirection(newDir) {
    // prevent reversing
    const cur = dirRef.current
    if (cur.x + newDir.x === 0 && cur.y + newDir.y === 0) return
    dirRef.current = newDir
    // if game not running, start on touch direction press
    if (!running) startLoop()
  }

  function spawnParticles(x, y, color) {
    const list = particlesRef.current
    for (let i = 0; i < 10; i++) {
      list.push({
        x: x + CELL / 2,
        y: y + CELL / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 40 + Math.floor(Math.random() * 30),
        color
      })
    }
  }

  function gameOver() {
    stopLoop()
    // submit score if we have an authenticated user
    const userId = auth?.user?.id || null
    if (userId) {
      submitScore('Snake', scoreRef.current, userId)
    }
    setEnded(true)
    endedRef.current = true
  }

  function step() {
    const cols = colsRef.current
    const rows = rowsRef.current
    const snake = snakeRef.current
    const dir = dirRef.current

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    // wall collision: end game when hitting walls
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      gameOver()
      return
    }

    // collision with self
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      stopLoop()
      return
    }

    snake.unshift(head)

    // eat
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const f = foodRef.current
      if (f.type === 'normal') {
        scoreRef.current = scoreRef.current + 1
        setScore(scoreRef.current)
      } else if (f.type === 'bonus') {
        scoreRef.current = scoreRef.current + 3
        setScore(scoreRef.current)
      } else if (f.type === 'slow') {
        // apply slow effect for short time
        slowUntilRef.current = Date.now() + 3000
        scoreRef.current = scoreRef.current + 1
        setScore(scoreRef.current)
      }
      spawnParticles(f.x * CELL, f.y * CELL, f.type === 'bonus' ? '#ffd86b' : '#ff6b6b')
      foodRef.current = spawnFood()
    } else {
      snake.pop()
    }

    // update difficulty scheduling: if using timeout loop, no immediate change here

    draw()
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    // Since we scaled with DPR earlier, drawing coordinates use CSS pixels
    const width = parseInt(canvas.style.width, 10) || canvas.width / dpr
    const height = parseInt(canvas.style.height, 10) || canvas.height / dpr

    // draw background image if available, otherwise green fill
    const bgImg = bgImageRef.current
    if (bgImg && bgImg.complete) {
      // draw image covering entire playfield
      ctx.drawImage(bgImg, 0, 0, width, height)
    } else {
      ctx.fillStyle = '#0aa84b'
      ctx.fillRect(0, 0, width, height)
    }

    // draw food with types
    const f = foodRef.current
    if (f) {
      if (f.type === 'bonus') ctx.fillStyle = '#ffd86b'
      else if (f.type === 'slow') ctx.fillStyle = '#6bb4ff'
      else ctx.fillStyle = '#ff4d4d'
      ctx.fillRect(f.x * CELL + 2, f.y * CELL + 2, CELL - 4, CELL - 4)
    }

    // draw snake with head/tail coloring
    for (let i = 0; i < snakeRef.current.length; i++) {
      const s = snakeRef.current[i]
      if (i === 0) ctx.fillStyle = '#7af77c'
      else if (i === snakeRef.current.length - 1) ctx.fillStyle = '#0b3d12'
      else ctx.fillStyle = '#1f6b2e'
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
    }

    // update and draw particles
    const parts = particlesRef.current
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life--
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, 3, 3)
      if (p.life <= 0) parts.splice(i, 1)
    }

    // HUD is rendered in the DOM for consistency with Game1
  }

  function restart() {
    stopLoop()
    initGame()
  }

  return (
    <div className="game3-page">
      <div className="arcade-frame">
        <div className="screen-top" />
        <div
          className="back"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/') }}
        >
          Back
        </div>
        <div className="score">Score: {score}</div>
        <div className="screen-sides-and-center">
          <div className="screen-side left" />
          <div
            className="screen-center"
            ref={centerRef}
            onTouchStart={(e) => {
              const t = e.touches && e.touches[0]
              if (t) touchStartRef.current = { x: t.clientX, y: t.clientY }
            }}
            onTouchEnd={(e) => {
              const start = touchStartRef.current
              if (!start) return
              const t = e.changedTouches && e.changedTouches[0]
              if (!t) return
              const dx = t.clientX - start.x
              const dy = t.clientY - start.y
              const absX = Math.abs(dx)
              const absY = Math.abs(dy)
              if (Math.max(absX, absY) < 20) return
              if (absX > absY) {
                if (dx > 0) changeDirection({ x: 1, y: 0 })
                else changeDirection({ x: -1, y: 0 })
              } else {
                if (dy > 0) changeDirection({ x: 0, y: 1 })
                else changeDirection({ x: 0, y: -1 })
              }
              touchStartRef.current = null
            }}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              onClick={() => {
                if (!running) startLoop()
                try {
                  canvasRef.current && canvasRef.current.focus()
                } catch (err) { console.debug('canvas focus failed', err) }
              }}
            />
            {/* Start / Game Over overlay */}
            {!running && (
              <div
                className="start-overlay"
                onClick={() => {
                  // if game over, restart; otherwise start
                  if (ended) restart()
                  else startLoop()
                  try {
                      canvasRef.current && canvasRef.current.focus()
                    } catch (err) { console.debug('canvas focus failed', err) }
                }}
              >
                <div className="start-text">
                  {ended ? `Game Over — Score ${score}` : 'Press Space to Start'}
                </div>
              </div>
            )}
          </div>
          <div className="screen-side right" />
        </div>
        <div className="screen-bottom" />
      </div>

      {/* Restart button removed — use Space or overlay to restart */}
      {/* Score rendered inside arcade frame */}
      {/* Touch controls for mobile */}
      <div className="touch-controls">
        <div className="dpad btn-group-vertical" role="group" aria-label="D-pad">
          <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 0, y: -1 })}>▲</button>
          <div className="dpad-row">
            <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: -1, y: 0 })}>◄</button>
            <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 1, y: 0 })}>►</button>
          </div>
          <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 0, y: 1 })}>▼</button>
        </div>
      </div>
    </div>
  )
}


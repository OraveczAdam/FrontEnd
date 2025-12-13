import React, { useRef, useEffect, useState } from 'react'
import './Game3.css'

export default function Game3() {
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

  const CELL = 28 // bigger cells for larger snake/food
  const SPEED = 110

  useEffect(() => {
    initGame()

    window.addEventListener('resize', handleResize)
    document.addEventListener('keydown', handleKey)

    return () => {
      stopLoop()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('keydown', handleKey)
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

  function spawnFood() {
    return {
      x: Math.floor(Math.random() * Math.max(1, colsRef.current)),
      y: Math.floor(Math.random() * Math.max(1, rowsRef.current))
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
    setScore(0)
    setRunning(false)
    draw()
  }

  function startLoop() {
    if (loopRef.current) return
    setRunning(true)
    loopRef.current = setInterval(step, SPEED)
  }

  function stopLoop() {
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
    setRunning(false)
  }

  function handleResize() {
    // restart game cleanly on resize
    stopLoop()
    initGame()
  }

  function handleKey(e) {
    if (e.code === 'Space') {
      e.preventDefault()
      if (!running) startLoop()
      return
    }

    if (!running) return

    // arrows to control while running
    if (e.key === 'ArrowUp' && dirRef.current.y !== 1) dirRef.current = { x: 0, y: -1 }
    if (e.key === 'ArrowDown' && dirRef.current.y !== -1)
      dirRef.current = { x: 0, y: 1 }
    if (e.key === 'ArrowLeft' && dirRef.current.x !== 1) dirRef.current = { x: -1, y: 0 }
    if (e.key === 'ArrowRight' && dirRef.current.x !== -1) dirRef.current = { x: 1, y: 0 }
  }

  function step() {
    const cols = colsRef.current
    const rows = rowsRef.current
    const snake = snakeRef.current
    const dir = dirRef.current

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    // wrap-around behavior
    if (head.x < 0) head.x = cols - 1
    if (head.x >= cols) head.x = 0
    if (head.y < 0) head.y = rows - 1
    if (head.y >= rows) head.y = 0

    // collision with self
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      stopLoop()
      return
    }

    snake.unshift(head)

    // eat
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore((s) => s + 1)
      foodRef.current = spawnFood()
    } else {
      snake.pop()
    }

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

    // background green fills center
    ctx.fillStyle = '#0aa84b'
    ctx.fillRect(0, 0, width, height)

    // draw food
    ctx.fillStyle = '#ff4d4d'
    ctx.fillRect(foodRef.current.x * CELL, foodRef.current.y * CELL, CELL, CELL)

    // draw snake
    ctx.fillStyle = '#004d00'
    for (let i = 0; i < snakeRef.current.length; i++) {
      const s = snakeRef.current[i]
      ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL)
    }
  }

  function restart() {
    stopLoop()
    initGame()
  }

  return (
    <div className="game3-page">
      <div className="arcade-frame">
        <div className="screen-top" />
        <div className="screen-sides-and-center">
          <div className="screen-side left" />
          <div className="screen-center" ref={centerRef}>
            <canvas ref={canvasRef} />
          </div>
          <div className="screen-side right" />
        </div>
        <div className="screen-bottom" />
      </div>

      <div className="game3-controls">
        <div className="score">Score: {score}</div>
        <button className="restart-btn" onClick={restart}>
          Restart
        </button>
      </div>
    </div>
  )
}


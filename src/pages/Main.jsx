import React from 'react'
import '../App.css'
import game1 from '../assets/game1.png'
import card from '../assets/card.png'
import snake from '../assets/snake.png'

function Main() {

	return (
		<div className="arcade-page">
			<main style={{ textAlign: 'center', marginTop: 100 }}>
				<div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
					<div className="game-card card-style">
						<img src={game1} alt="Game 1" />
						<h3 style={{ color: 'white', fontSize: 14, margin: '10px 0' }}>Fighter</h3>
						<button>Play Game</button>
					</div>

					<div className="game-card card-style">
						<img src={card} alt="Game 2" />
						<h3 style={{ color: 'white', fontSize: 14, margin: '10px 0' }}>Memory</h3>
						<button>Play Game</button>
					</div>

					<div className="game-card card-style">
						<img src={snake} alt="Game 3" />
						<h3 style={{ color: 'white', fontSize: 14, margin: '10px 0' }}>Snake</h3>
						<button>Play Game</button>
					</div>
				</div>

				{/* Teszt gomb eltávolítva a kérés szerint */}
			</main>
		</div>
	)
}

export default Main

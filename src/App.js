import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './App.css'
import JoinCreateModal from './JoinCreateModal'

//create your forceUpdate hook
function useForceUpdate() {
  const [_, setValue] = useState(0) // integer state
  return () => setValue(value => value + 1) // update the state to force render
}

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const [darkMode, setDarkMode] = useState(false)
  const [baseServer, setBaseServer] = useState('cah-backend.robreid.xyz')
  const [boxes, setBoxes] = useState([])
  const [selectedBoxes, setSelectedBoxes] = useState([])
  const [socketUrl, setSocketUrl] = useState('wss://localhost')
  const [gameName, setGameName] = useState(urlParams.get('game') || '')
  const [playerName, setPlayerName] = useState('')
  const [playerCards, setPlayerCards] = useState([])
  const [playerMap, setPlayerMap] = useState({})
  const [selectedCards, setSelectedCards] = useState([])
  const [selectedWinningCards, setSelectedWinningCards] = useState([])
  const [blackCard, setBlackCard] = useState('')
  const [spotCount, setSpotCount] = useState(0)
  const [cardsPlayed, setCardsPlayed] = useState([])
  const [cardCzar, setCardCzar] = useState('')
  const [played, setPlayed] = useState(false)
  const [decisionTime, setDecisionTime] = useState(false)
  const [czarMode, setCzarMode] = useState("winner")
  const [showCoppied, setShowCoppied] = useState(false)
  const forceUpdate = useForceUpdate()
  const [modalShow, setModalShow] = React.useState(false);

  const onMessageRecived = (msg) => {
    console.log(msg)
    let data = JSON.parse(msg.data)
    setPlayerMap(data.player_scores)
    setBlackCard(data.round.black_card)
    setCardsPlayed(data.round.white_cards)
    setCardCzar(data.round.czar)
    setSpotCount(data.round.white_cards_required)
    setPlayerCards(data.your_cards)
    setDecisionTime(data.round.white_cards.length === (Object.keys(data.player_scores).length - 1))
    if(data.round.white_cards.length === 0) {
      setPlayed(false)
      setSelectedWinningCards([])
    }
    forceUpdate()
  }
  const {
    readyState,
  } = useWebSocket(socketUrl, {
    onMessage: onMessageRecived,
    onerror: console.log
  })


  const handleClickChangeSocketUrl = () => {
    setSocketUrl('wss://localhost')
    setSocketUrl(`wss://${baseServer}/games/${gameName}/players/${playerName}`)
  }

  const playCard = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: selectedCards
      })
    }
    fetch(`https://${baseServer}/games/${gameName}/players/${playerName}/cards`, requestOptions)
    setSelectedCards([])
    setPlayed(true)
  }


  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState]


  const toggleSelectedCard = card => {
    if (cardCzar === playerName || blackCard === '' || played) {
      return
    }
    if (selectedCards.includes(card)) {
      const index = selectedCards.indexOf(card)
      if (index > -1) {
        selectedCards.splice(index, 1)
      }
    } else {
      if (selectedCards.length >= spotCount) {
        return
      }
      selectedCards.push(card)
    }
    setSelectedCards(selectedCards)
    forceUpdate()
  }

  const selectWinningCards = cards => {
    if (cardCzar !== playerName || blackCard === '') {
      return
    }
    setSelectedWinningCards(cards)
    forceUpdate()
  }

  

  const confirmWinningCards = () => {
    if (cardCzar === playerName) {
      const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: selectedWinningCards
      })
    }
    fetch(`https://${baseServer}/games/${gameName}/winner`, requestOptions)
    }
  }


  const startGame = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
    fetch(`https://${baseServer}/games/${gameName}/start`, requestOptions)
  }

  const CreateGame = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: gameName,
        boxes: selectedBoxes,
        czar_selector: czarMode
      })
    }
    fetch(`https://${baseServer}/games`, requestOptions)
    .then(x => handleClickChangeSocketUrl()) 
  }

  const getBoxes = () => {
    if (boxes.length > 0) {
      return
    }
    const requestOptions = {
      method: 'GET',
    }
    fetch(`https://${baseServer}/boxes`, requestOptions)
      .then(response => response.json())
      .then(data => setBoxes(data.boxes))
  }
  getBoxes()

  const toggleBox = (box) => {
    if (selectedBoxes.includes(box)) {
      setSelectedBoxes(selectedBoxes.filter(x => x !== box))
    } else {
      selectedBoxes.push(box)
      setSelectedBoxes(selectedBoxes)
    }
    forceUpdate()
  }

  function copyGameLink() {
    navigator.clipboard.writeText(`https://${window.location.host}/?game=${gameName}`)
    setShowCoppied(true)
    setTimeout(() => setShowCoppied(false), 1000)
  }


if (urlParams.get('game') && !modalShow) {
  setModalShow(true)
}

  return (
    <div className={'App ' + (darkMode ? 'dark-mode' : '')}>
      <div className="light-swich">
        <label className="fa fa-lightbulb-o">
          <input type="checkbox" onChange={e => setDarkMode(e.target.checked)} />
        </label>
      </div>
      <header>
        <h1>Cards Against Humanity</h1>
        {readyState !== ReadyState.OPEN &&
        <div>
        <img src="/logo192.png" alt="Logo" />
                    <h2>Unofficial Online Edition</h2>
                    <h3>What is the Unofficial Online Edition?</h3>
                    <p>
                      "Cards Against Humanity is a party game for horrible people. Unlike most of the party
                      games you've played before, Cards Against Humanity is as despicable and awkward as you and
                      your friends.
                    </p>
                    <p>
                      The game is simple. Each round, one player asks a question from a black card, and everyone
                      else answers with their funniest white card."
                    </p>
                    <p>The Unoffical Online Edition is a fan created online version of the game.</p>
            <Button variant="primary" onClick={() => setModalShow(true)}>
          Get Started
        </Button>

        <JoinCreateModal 
          urlParams={urlParams}
          boxes={boxes}
          selectedBoxes={selectedBoxes}
          toggleBox={toggleBox}
          setGameName={setGameName}
          gameName={gameName}
          setPlayerName={setPlayerName}
          czarMode={czarMode}
          setCzarMode={setCzarMode}
          CreateGame={CreateGame}
          handleClickChangeSocketUrl={handleClickChangeSocketUrl}
          playerName={playerName}
          show={modalShow}
          onHide={() => setModalShow(false)}
        />
        </div>
        }
      </header>
      {readyState === ReadyState.OPEN &&
        <main className="row">
          <h3>Game: {gameName}</h3>
          <Button className="share-button" onClick={copyGameLink}>
            <i className="fa fa-share-alt" aria-hidden="true"></i>
            {showCoppied && <span>&nbsp;&nbsp;Coppied!</span>}
          </Button>
          <div className="player-list col-12">
            <h3>Players</h3>
            <p>
              { Object.entries(playerMap).map(([name, score]) => 
              <span key={name} className="player-list-player">
              {name}{name === playerName && '(you)'}:{score}
              &nbsp;&nbsp;</span>)}
            </p>
          </div>
          <div className="desk col-12">
            <h3>Desk - Czar:{cardCzar === playerName ? `${cardCzar}(you)` : cardCzar}</h3>
            <div className="cards-box">
              {blackCard && <Card className="base-card black-card">
                <Card.Body>
                  <Card.Text>{blackCard}</Card.Text>
                </Card.Body>
              </Card >}
              {!blackCard &&
                <Button className="full-width" onClick={startGame}>
                  Start Game
                </Button>}
              {cardsPlayed.map(cards => 
                <div className="card-group" key={cards[0]} onClick={() => selectWinningCards(cards)} disabled={cardCzar !== playerName}>{
                  cards.map(card =>
                    <Card key={card} className={'base-card ' + (selectedWinningCards.includes(card) ? 'base-card-selected' : '')}>
                      <Card.Body>
                        <Card.Text>{decisionTime && card}</Card.Text>
                      </Card.Body>
                    </Card >
                  )}</div>
              )}
              {selectedWinningCards.length !== 0 &&
                <Button className="full-width" onClick={confirmWinningCards}>
                  Confirm Winner
                </Button>}
            </div>
          </div>
          <div className="player-cards col-12">
              <h2>Your Cards</h2>
              {selectedCards.length === spotCount && cardCzar !== playerName && !played && 
              <Button className="full-width" onClick={playCard}>
                Play Cards
              </Button>}

              <div className="cards-box">
                {playerCards.map(card =>
                  <Card key={card} className={'base-card ' + (selectedCards.includes(card) ? 'base-card-selected' : '')} onClick={() => toggleSelectedCard(card)}>
                    <Card.Body>
                      <span className="selected-counter">{selectedCards.indexOf(card) > -1 && spotCount > 1 ? selectedCards.indexOf(card) + 1 : ''}</span>
                      <Card.Text>{card}</Card.Text>
                    </Card.Body>
                  </Card >)}
              {cardCzar === playerName && <div className="card-czar-overlay">You're Card Czar!</div>}
            </div>
          </div>
        </main>
      }
      {urlParams.get('dev') && 
      <div>
        <span>You are {connectionStatus === "Open" ? "connected" : "disconnected"}</span>
      </div>}
    </div>
  )
}

export default App

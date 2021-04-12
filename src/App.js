import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Accordion from 'react-bootstrap/Accordion'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './App.css'

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
  const [gameName, setGameName] = useState(urlParams.get('game') || 'our_super_game')
  const [playerName, setPlayerName] = useState('')
  const [playerCards, setPlayerCards] = useState([])
  const [playerMap, setPlayerMap] = useState({})
  const [selectedCards, setSelectedCards] = useState([])
  const [blackCard, setBlackCard] = useState('')
  const [spotCount, setSpotCount] = useState(0)
  const [cardsPlayed, setCardsPlayed] = useState([])
  const [cardCzar, setCardCzar] = useState('')
  const [played, setPlayed] = useState(false)
  const [decisionTime, setDecisionTime] = useState(false)
  const [czarMode, setCzarMode] = useState("winner")
  const forceUpdate = useForceUpdate()

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
    fetch(`https://${baseServer}/games/${gameName}/players/${playerName}`, requestOptions)
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
    if (cardCzar === playerName || blackCard === '') {
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

  const selectWinningCards = (cards) => {
    if (cardCzar === playerName) {
      const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: cards
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
    let data = fetch(`https://${baseServer}/boxes`, requestOptions)
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
  }




  return (
    <div className={'App ' + (darkMode ? 'dark-mode' : '')}>
      <div>
          <span>The WebSocket is currently {connectionStatus}</span>
      </div>
      <div className="light-swich">
        <label className="fa fa-lightbulb-o">
          <input type="checkbox" onChange={e => setDarkMode(e.target.checked)} />
        </label>
      </div>
      <header>
        <h1>Cards Against Humanity</h1>
        {readyState !== ReadyState.OPEN &&
          <Form.Group>
            {!urlParams.get('game') && 
              <Accordion defaultActiveKey="1">
              <Card>
                <Accordion.Toggle as={Card.Header} eventKey="0">
                  Create Game options <i class="fa fa-chevron-down" aria-hidden="true"></i>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="0">
                  <Card.Body>
                    <h4>Box Selection</h4>
                    <div className="cards-box deck-box">
                      {boxes.map(x =>
                        <Card key={x} className={'base-card ' + (selectedBoxes.includes(x) ? 'base-card-selected' : '')} onClick={() => toggleBox(x)}>
                          <Card.Body>
                            <Card.Text>{x}</Card.Text>
                          </Card.Body>
                        </Card >
                      )}
                    </div>
                    <div className="czar-mode">
                      <h4>Czar Mode</h4>
                      <label>
                        <input type="radio" value="winner"
                          checked={czarMode === "winner"}
                          onChange={() => setCzarMode("winner")}
                        />
                        Winner
                      </label>
                      <label>
                        <input type="radio" value="random"
                          checked={czarMode === "random"}
                          onChange={() => setCzarMode("random")}
                        />
                        Random
                      </label>
                      <label>
                        <input type="radio" value="round_robin"
                          checked={czarMode === "round_robin"}
                          onChange={() => setCzarMode("round_robin")}
                        />
                        Round robin
                      </label>
                    </div>
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>}
            <Form.Control as="input" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="Game Name" disabled={urlParams.get('game')} />
            <Form.Control as="input" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player Name" />
            <Button 
              onClick={() => selectedBoxes.length > 0? CreateGame() : handleClickChangeSocketUrl()} disabled={gameName === '' || playerName === ''}>
              {selectedBoxes.length > 0? "Create Game": "Connect"}
            </Button>
          </Form.Group>
        }
      </header>
      {readyState === ReadyState.OPEN &&
        <main className="row">
          <h3>Game: {gameName}</h3>
          <Button className="share-button" onClick={copyGameLink}>
            <i class="fa fa-share-alt" aria-hidden="true"></i>
          </Button>
          <div className="player-list col-12">
            <h3>Players</h3>
            <p>
              { Object.entries(playerMap).map(([name, score]) => 
              <span key={name} className="player-list-player">{name}:
              {name === playerName && '(you)'} {score}
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
                <Button onClick={startGame}>
                  Start Game
                </Button>}
              {cardsPlayed.map(cards =>
                <div className="card-group" onClick={() => selectWinningCards(cards)} disabled={cardCzar !== playerName}>{
                  cards.map(card =>
                    <Card key={card} className="base-card">
                      <Card.Body>
                        <Card.Text>{decisionTime && card}</Card.Text>
                      </Card.Body>
                    </Card >
                  )}</div>
              )}
            </div>
          </div>
          <div className="player-cards col-12">
              <h2>Your Cards</h2>
              <Button onClick={playCard} disabled={selectedCards.length !== spotCount || cardCzar === playerName || played}>
                Play Cards
              </Button>

              <div className="cards-box">
                {playerCards.map(x =>
                  <Card key={x} className={'base-card ' + (selectedCards.includes(x) ? 'base-card-selected' : '')} onClick={() => toggleSelectedCard(x)}>
                    <Card.Body>
                      <span className="selected-counter">{selectedCards.indexOf(x) > -1 && spotCount > 1 ? selectedCards.indexOf(x) + 1 : ''}</span>
                      <Card.Text>{x}</Card.Text>
                    </Card.Body>
                  </Card >)}
              {cardCzar === playerName && <div className="card-czar-overlay">You're Card Czar!</div>}
            </div>
          </div>
        </main>
      }
    </div>
  )
}

export default App

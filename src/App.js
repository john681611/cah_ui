import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';

//create your forceUpdate hook
function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update the state to force render
}

function App() {
  const [socketUrl, setSocketUrl] = useState('wss://localhost');
  const [gameName, setGameName] = useState('our_super_game');
  const [playerName, setPlayerName] = useState('');
  const [playerCards, setPlayerCards] = useState([]);
  const [playerMap, setPlayerMap] = useState({});
  const [selectedCards, setSelectedCards] = useState([]);
  const [blackCard, setBlackCard] = useState("");
  const [spotCount, setSpotCount] = useState(0);
  const [cardsPlayed, setCardsPlayed] = useState([]);
  const [cardCzar, setCardCzar] = useState("");
  const [played, setPlayed] = useState(false);
  const [decisionTime, setDecisionTime] = useState(false);
  const forceUpdate = useForceUpdate();

  const onMessageRecived = (msg) => {
    console.log(msg)
    let data = JSON.parse(msg.data)
    switch (data.type) {
      case "card_replenishment":
        playerCards.push(...data.data)
        setPlayerCards(playerCards)
        break;
      case "players":
        setPlayerMap(data.data)
        break;
      case "round_info":
        setPlayed(false)
        setCardsPlayed([])
        setBlackCard(data.data.black_card)
        setCardCzar(data.data.card_czar)
        let spots = (data.data.black_card.match(/_____/g) || []).length;
        setSpotCount(spots === 0 ? 1 : spots)
        break;
      case "card_played":
        cardsPlayed.push(data.data)
        setCardsPlayed(cardsPlayed)
        if (cardsPlayed.length === Object.keys(playerMap).length - 1) {
          setDecisionTime(true)
        }
        break;
      default:
        break;
    }
    forceUpdate()
  }
  const {
    sendMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    onMessage: onMessageRecived
  });


  const handleClickChangeSocketUrl = () => {
    setSocketUrl(`ws://localhost:1234/games/${gameName}/players/${playerName}`)
  }

  const playCard = () => {
    sendMessage(`{"type":"play_card","data":{"cards":${JSON.stringify(selectedCards)}}}`);
    for (const card in selectedCards) {
      const index = playerCards.indexOf(card);
      if (index > -1) {
        playerCards.splice(index, 1);
      }
    }
    setPlayerCards(playerCards)
    setSelectedCards([])
    setPlayed(true)
  }


  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];


  const toggleSelectedCard = card => {
    if (cardCzar === playerName || blackCard === "") {
      return;
    }
    if (selectedCards.includes(card)) {
      const index = selectedCards.indexOf(card);
      if (index > -1) {
        selectedCards.splice(index, 1);
      }
    } else {
      if (selectedCards.length >= spotCount) {
        return;
      }
      selectedCards.push(card)
    }
    setSelectedCards(selectedCards)
    forceUpdate()
  }

  const selectWinningCards = (cards) => {
    if (cardCzar !== playerName) {
      sendMessage(`{"type":"choose_winner","data":{"cards":${JSON.stringify(cards)}}}`);
    }
  }


  return (
    <div className="App">
      <header>
        {readyState !== ReadyState.OPEN &&
          <Form.Group>
            <Form.Control as="input" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="Game Name" />
            <Form.Control as="input" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player Name" />
            <Button onClick={handleClickChangeSocketUrl} disabled={gameName === "" || playerName === ""}>
              Connect to Game
        </Button>
          </Form.Group>
        }
      </header>
      {readyState === ReadyState.OPEN &&
        <main className="row">
          <div className="desk col-12">
            <h3>Desk - Czar:{cardCzar === playerName? `${cardCzar}(you)`: cardCzar}</h3>
            <div className="cards-box">
              {blackCard && <Card className="cards-card black-card">
                <Card.Body>
                  <Card.Text>{blackCard}</Card.Text>
                </Card.Body>
              </Card >}
              {cardsPlayed.map(cards =>
                <div onClick={() => selectWinningCards(cards)} disabled={cardCzar !== playerName}>{
                  cards.map(card =>
                    <Card className="cards-card ">
                      <Card.Body>
                        <Card.Text>{decisionTime && card}</Card.Text>
                      </Card.Body>
                    </Card >
                  )}</div>
              )}
            </div>
          </div>
          <div className="player-list col-12">
            <h3>Players</h3>
            <p>
              {Object.keys(playerMap).map(x => <span className="player-list-player">{x === playerName? `${x}(you)`: x}:{playerMap[x]}&nbsp;&nbsp;</span>)}
            </p>
          </div>
          <div className="player-cards col-12">
            <h2>Your Cards</h2>
            <div className="cards-box">
              {playerCards.map(x =>
                <Card className={"cards-card " + (selectedCards.includes(x) ? "player-cards-card-selected" : "")} onClick={() => toggleSelectedCard(x)}>
                  <Card.Body>
                    <Card.Title>{selectedCards.indexOf(x) > -1 ? selectedCards.indexOf(x) + 1 : ""}</Card.Title>
                    <Card.Text>{x}</Card.Text>
                  </Card.Body>
                </Card >)}
            </div>
            <Button onClick={playCard} disabled={selectedCards.length !== spotCount || cardCzar === playerName || played}>
              Play Cards
            </Button>
          </div>
        </main>
      }
      <div>
        <span>The WebSocket is currently {connectionStatus}</span>
      </div>
    </div>
  );
}

export default App;

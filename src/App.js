import React, { useState, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';

//create your forceUpdate hook
function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update the state to force render
}

function App() {
  const [socketUrl, setSocketUrl] = useState('wss://localhost');
  const [gameName, setGameName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerCards, setPlayerCards] = useState(["Card1", "Card2"]);
  const [playerList, setPlayerList] = useState([{ name: "Dave", score: 0 }, { name: "Kev", score: 2 }]);
  const [selectedCards, setSelectedCards] = useState([]);
  const messageHistory = useRef([]);
  const forceUpdate = useForceUpdate();
  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket(socketUrl);

  messageHistory.current = useMemo(() =>
    messageHistory.current.concat(lastMessage), [lastMessage]);

  const handleClickChangeSocketUrl = () => {
    setSocketUrl(`ws://localhost:1234/games/${gameName}/players/${playerName}`)
  }

  const handleClickSendMessage = () =>
    sendMessage('Hello');

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];


const toggleSelectedCard = card => {
  if(selectedCards.includes(card)){
    const index = selectedCards.indexOf(card);
    if (index > -1) {
      selectedCards.splice(index, 1);
    }
  } else {
    selectedCards.push(card)
  }
  setSelectedCards(selectedCards)
  forceUpdate()
} 


  return (
    <div className="App container">
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
          <div className="player-list col-2">
            <h3>Players</h3>
            <ul className="">
              {playerList.map(x => <li className="player-list-player">{x.name}:{x.score}</li>)}
            </ul>
          </div>
          <div className="player-cards col-10">
            <h2>Your Cards</h2>
            <div className="player-cards-box">
              {playerCards.map(x =>
                <Card className={"player-cards-card " + (selectedCards.includes(x) ? "player-cards-card-selected": "")} onClick={() => toggleSelectedCard(x)}>
                  <Card.Body>
                    <Card.Title>{x}</Card.Title>
                  </Card.Body>
                </Card >)}
            </div>
            <Button onClick={handleClickChangeSocketUrl} disabled={selectedCards.length === 0}>
              Play Cards
            </Button>
          </div>
        </main>
      }
      <div>
        <Button
          onClick={handleClickSendMessage}
          disabled={readyState !== ReadyState.OPEN}
        >
          Click Me to send 'Hello'
      </Button>
        <span>The WebSocket is currently {connectionStatus}</span>
        {lastMessage != null ? <span>Last message: {lastMessage.data}</span> : null}
        <ul>
          {messageHistory.current
            .map((message, idx) => message != null ? <div key={idx}>{message.data}</div> : null)}
        </ul>
        {/* JSON.stringify(data, null, 2)  */}
      </div>
    </div>
  );
}

export default App;

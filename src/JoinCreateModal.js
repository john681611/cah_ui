import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Accordion from 'react-bootstrap/Accordion'
import Modal from 'react-bootstrap/Modal'

export default function JoinCreateModal(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {!props.urlParams.get('game') && "New/"}Join Game
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
       <Form.Group>
            {!props.urlParams.get('game') && 
              <Accordion defaultActiveKey="0">
              <Card>
                <Accordion.Toggle as={Card.Header} eventKey="1">
                  Create Game options <i className="fa fa-chevron-down" aria-hidden="true"></i>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="1">
                  <Card.Body>
                    <h4>Box Selection</h4>
                    <div className="cards-box deck-box">
                      {props.boxes.map(x =>
                        <Card key={x} className={'base-card ' + (props.selectedBoxes.includes(x) ? 'base-card-selected' : '')} onClick={() => props.toggleBox(x)}>
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
                          checked={props.czarMode === "winner"}
                          onChange={() => props.setCzarMode("winner")}
                        />
                        Winner
                      </label>
                      <label>
                        <input type="radio" value="random"
                          checked={props.czarMode === "random"}
                          onChange={() => props.setCzarMode("random")}
                        />
                        Random
                      </label>
                      <label>
                        <input type="radio" value="round_robin"
                          checked={props.czarMode === "round_robin"}
                          onChange={() => props.setCzarMode("round_robin")}
                        />
                        Round robin
                      </label>
                    </div>
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>}
            <Form.Control as="input" value={props.gameName} onChange={e => props.setGameName(e.target.value)} placeholder="Game Name" disabled={props.urlParams.get('game')} />
            <Form.Control as="input" value={props.playerName} onChange={e => props.setPlayerName(e.target.value)} placeholder="Player Name" />
            <Button className="full-width"
              onClick={() => props.selectedBoxes.length > 0? props.CreateGame() : props.handleClickChangeSocketUrl()} disabled={props.gameName === '' || props.playerName === ''}>
              {props.selectedBoxes.length > 0? "Create Game": "Connect"}
            </Button>
          </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
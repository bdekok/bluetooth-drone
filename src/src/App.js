import React, {Component} from 'react';
import {Directions, Gamepad} from './Gamepad'
import {ParrotDrone} from './Drone';
import ControllerSVG from './ControllerSVG'
class App extends Component {
  render() {
    return (
      <DroneViewCtrl />
    )
  }
}

class DroneViewCtrl extends Component {
  constructor(props) {
    super(props);
    this.state = {
      drone: new ParrotDrone(),
      pendingConnection: false,
      droneConnected: false,
      gamepadConnected: false,
      stickDirection: 'center',
      buttonsPressed: []
    }
    for (let x = 0; x < 18; x++) {
      this.state.buttonsPressed[x] = false;
    }
  }

  connect = () => {
    this.setState({pendingConnection: true});
    this.state.drone.connect().then(() => {
      this.setState({droneConnected: true, pendingConnection: false});
    });
  }

  gamepadConnected = (connected) => {
    this.setState({gamepadConnected: connected});
  }

  buttonPressed = (button, pressed) => {
    this.setState(prevState => {
      prevState.buttonsPressed[button] = pressed;
      return prevState;
    })

    switch (button) {
      case 0:
        if (pressed) {this.state.drone.takeOff()};
        break;
      case 1:
        if (pressed) {this.state.drone.land()};
        break;
      case 12:
        if (pressed) {
          this.state.drone.moveUp();
        } else {
          this.state.drone.hover()
        }
        break;
      case 13:
        if (pressed) {
          this.state.drone.moveDown();
        }
        break;
      case 3:
        if (pressed) {
          this.state.drone.flip();
        }
        break;
      default:
        break;
    }
  }

  gamepadAxisChanged = (direction) => {
    this.setState({stickDirection: direction})
    switch (direction) {
      case Directions.LEFT:
        this.state.drone.moveLeft();
        break;
      case Directions.RIGHT:
        this.state.drone.moveRight();
        break;
      case Directions.TOP:
        this.state.drone.moveForwards();
        break;
      case Directions.BOTTOM:
        this.state.drone.moveBackwards();
        break;
      case Directions.TOPLEFT:
        this.state.drone.moveLeftForwards();
        break;
      case Directions.TOPRIGHT:
        this.state.drone.moveRightForwards();
        break;
      case Directions.BOTTOMLEFT:
        this.state.drone.moveLeftBackwards();
        break;
      case Directions.BOTTOMRIGHT:
        this.state.drone.moveRightBackwards();
        break;
      case Directions.CENTER:
        this.state.drone.hover();
        break;
      default:
        break;
    }
  }

  render() {
    if (!this.state.droneConnected) {
      return (
        <div className='center'>
          {this.state.pendingConnection ? 'Connecting....' :
            <button onClick={this.connect}>Connect</button>
          }
        </div>
      )
    } else {

      return (
        <div>
          {this.state.droneConnected &&
            <Gamepad onDirectionChange={this.gamepadAxisChanged}
              onButtonPressed={this.buttonPressed}
              onGamepadConnected={this.gamepadConnected}></Gamepad>
          }
          {this.state.droneConnected && this.state.gamepadConnected &&
            <ControllerSVG stickDirection={this.state.stickDirection}
              buttonsPressed={this.state.buttonsPressed} />
          }
        </div>
      )
    }
  }
}

export default App;

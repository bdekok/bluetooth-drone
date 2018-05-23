import React from 'react';

export const Directions = {
  CENTER: 'center',
  TOP: 'top',
  TOPRIGHT: 'top right',
  RIGHT: 'right',
  BOTTOMRIGHT: 'bottom right',
  BOTTOM: 'bottom',
  BOTTOMLEFT: 'bottom left',
  LEFT: 'left',
  TOPLEFT: 'top left'
}

const controllerThreshold = 0.2;

export class Gamepad extends React.Component {
  constructor(props) {
    super(props);
    this.gamePadLoop = null;

    this.gamepadState = {
      direction: null,
      buttons: {},
      connected: false
    }
    for (let x = 0; x < 18; x++) {
      this.gamepadState.buttons[x] = false;
    }
  }
  componentDidMount() {
    this.gamePadLoop = window.requestAnimationFrame(this.gamePadStatusLoop.bind(this))
  }
  componentWillUnmount() {
    window.cancelRequestAnimationFrame(this.gamePadLoop);
  }

  getGamePad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    if (!gamepads) {
      console.error('no gamepads found or no browser support')
      return;
    }
    // Only return first one found for now 
    // Read: I'm too lazy implementing multiple controllers
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        return gamepads[i];
      }
    }
  }

  gamePadStatusLoop() {
    const gp = this.getGamePad();
    if (gp) {

      if (this.gamepadState.connected !== gp.connected) {
        this.gamepadState.connected = gp.connected;
        this.props.onGamepadConnected(gp.connected);
      }

      if (gp.connected) {
        this.setStickDirection(gp.axes[0], gp.axes[1]);
        this.setButtonsState(gp.buttons);
      }
    }

    this.gamePadLoop = window.requestAnimationFrame(this.gamePadStatusLoop.bind(this));
  }

  setStickDirection(xAxis, yAxis){
    const direction = this.AxisToDirection(xAxis, yAxis);
    if (direction !== this.gamepadState.direction) {
      this.gamepadState.direction = direction;
      this.props.onDirectionChange(direction)
    }
  }
  setButtonsState(buttons) {
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].pressed !== this.gamepadState.buttons[i]) {
        this.gamepadState.buttons[i] = buttons[i].pressed;
        this.props.onButtonPressed(i, buttons[i].pressed)
      }
    }
  }

  AxisToDirection(xAxis, yAxis) {
    const xAxisActive = xAxis > controllerThreshold || xAxis < -controllerThreshold;
    const yAxisActive = yAxis > controllerThreshold || yAxis < -controllerThreshold;

    let direction = Directions.CENTER;
    if (xAxisActive || yAxisActive) {
      const rad = Math.atan2(yAxis, xAxis);
      const deg = parseInt((rad / Math.PI * 180) + (rad > 0 ? 0 : 360), 10);
      direction = this.getDirection(deg);
    }
    return direction;
  }

  getDirection(deg) {
    // There has to be a better way than this
    // should have paid more attention during maths.
    if ((deg > 337) || (deg >= 0 && deg <= 22)) {
      return Directions.RIGHT;
    } else if (deg > 22 && deg <= 67) {
      return Directions.BOTTOMRIGHT;
    } else if (deg > 67 && deg <= 112) {
      return Directions.BOTTOM;
    } else if (deg > 112 && deg <= 157) {
      return Directions.BOTTOMLEFT;
    } else if (deg > 157 && deg <= 202) {
      return Directions.LEFT;
    } else if (deg > 202 && deg <= 247) {
      return Directions.TOPLEFT;
    } else if (deg > 247 && deg <= 292) {
      return Directions.TOP;
    } else if (deg > 292 && deg <= 337) {
      return Directions.TOPRIGHT;
    }
  }

  render() {
    return (<div></div>)
  }
}
const DEFAULT_SPEED = 30;
const DEFAULT_DRIVE_STEPS = 20;

export class ParrotDrone {
  constructor() {
    this.droneDevice = null;
    this.gattServer = null;

    // Used to store the 'counter' that's sent to each characteristic
    this.steps = {
      'fa0a': 1,
      'fa0b': 1,
      'fa0c': 1
    };

    this.speeds = {
      yaw: 0,     // turn
      pitch: 0,   // forward/backward
      roll: 0,    // left/right
      altitude: 0 // up/down
    };

    this.ping = null;
    this.driveStepsRemaining = 0;
    this.services = {};
    this.characteristics = {};
    this.onDisconnectCallback = null;
  }

  _getUUID(uniqueSegment) {
    return `9a66${uniqueSegment}-0800-9191-11e4-012d1540cb8e`;
  }

  _startNotificationsForCharacteristic(serviceID, characteristicID) {

    console.log('Start notifications for', characteristicID);

    return new Promise((resolve, reject) => {
      return this._getCharacteristic(serviceID, characteristicID).then(characteristic => {
        console.log('Got characteristic, now start notifications', characteristicID, characteristic);
        characteristic.startNotifications().then(() => {
          console.log('Started notifications for', characteristicID);
          characteristic.addEventListener('characteristicvaluechanged', event => {

            const array = new Uint8Array(event.target.value.buffer);
            let a = [];
            for (let i = 0; i < array.byteLength; i++) {
              a.push(`0x${('00' + array[i].toString(16)).slice(-2)}`);
            }
            console.log(`Notification from ${characteristicID}: ${a.join(' ')}`);

            if (characteristicID === 'fb0e') {
              const eventList = ['fsLanded', 'fsTakingOff', 'fsHovering', 'fsUnknown', 'fsLanding', 'fsCutOff'];
              // if (eventList[array[6]] === 'fsHovering') {
              //   console.log('Hovering - ready to go');
              // } else {
              //   console.log('Not hovering... Not ready', array[6]);
              // }

              // if ([1, 2, 3, 4].includes(array[6])) {
              //   console.log('Flying');
              // }
              // else {
              //   console.log('Not flying');
              // }

            } else if (characteristicID === 'fb0f') {

              const batteryLevel = array[array.length - 1];
              console.log(`Battery Level: ${batteryLevel}%`);
              if (batteryLevel < 10) {
                console.error('Battery level too low!');
              }

            }
          });
          resolve();
        });

      })
        .catch(error => {
          console.error('startNotifications error', error);
          reject();
        });
    });
  }

  _discover() {
    console.log('Searching for drone...');
    return navigator.bluetooth.requestDevice({
      filters: [
        {namePrefix: 'RS_'},
        {namePrefix: 'Mars_'},
        {namePrefix: 'Travis_'}
      ],
      optionalServices: [
        this._getUUID('fa00'),
        this._getUUID('fb00'),
        this._getUUID('fd21'),
        this._getUUID('fd51')
      ]
    }).then((device) => {
      console.log('Discovered drone', device);
      this.droneDevice = device;
    });
  }

  _connectGATT() {
    console.log('Connect GATT');
    this.droneDevice.addEventListener('gattserverdisconnected', this._handleDisconnect.bind(this));

    return this.droneDevice.gatt.connect().then(server => {
      console.log('GATT server', server);
      this.gattServer = server;
    });
  }

  _reset() {
    this.ping = null;
    this.driveStepsRemaining = 0;
    this.services = {};
    this.characteristics = {};
    this.onDisconnectCallback = null;
  }

  _handleDisconnect() {
    if (this.onDisconnectCallback && typeof this.onDisconnectCallback === 'function') {
      this.onDisconnectCallback();
    }
    this._reset();
    this.droneDevice.removeEventListener('gattserverdisconnected', this._handleDisconnect.bind(this));
  }

  _getService(serviceID) {
    return new Promise((resolve, reject) => {
      const service = this.services[serviceID];

      // If we already have it cached...
      if (service) {
        console.log('Return cached service', service);
        resolve(service);
      } else {
        console.log('Get service', this._getUUID(serviceID));
        return this.gattServer.getPrimaryService(this._getUUID(serviceID)).then(service => {
          console.log('Obtained service', service);
          this.services[serviceID] = service;
          resolve(service);
        })
          .catch(error => {
            console.error('_getService error', error);
            reject(error);
          });
      }
    });
  }

  _getCharacteristic(serviceID, characteristicID) {
    return new Promise((resolve, reject) => {
      const char = this.characteristics[characteristicID];
      // If we already have it cached...
      if (char) {
        // console.log('Return cached characteristic', char);
        resolve(char);
      } else {
        return this._getService(serviceID).then(service => {
          return service.getCharacteristic(this._getUUID(characteristicID))
        }).then(characteristic => {
          this.characteristics[characteristicID] = characteristic;
          console.log('Obtained characteristic', characteristic);
          resolve(characteristic);
        })
          .catch(error => {
            console.error('_getCharacteristic error', error);
            reject(error);
          });
      }
    })

  }

  _writeCommand(characteristic, commandArray) {
    const buffer = new ArrayBuffer(commandArray.length);
    const command = new Uint8Array(buffer);
    command.set(commandArray);
    // console.log('Write command', command);
    return characteristic.writeValue(command);
  }

  _writeTo(serviceID, characteristicID, commandArray) {
    return this._getCharacteristic(serviceID, characteristicID).then(characteristic => {
      return this._writeCommand(characteristic, commandArray);
    });
  }

  _startNotifications() {
    console.log('Start notifications...');
    return this._startNotificationsForCharacteristic('fb00', 'fb0f')
      .then(() => {return this._startNotificationsForCharacteristic('fb00', 'fb0e')})
      .then(() => {return this._startNotificationsForCharacteristic('fb00', 'fb1b')})
      .then(() => {return this._startNotificationsForCharacteristic('fb00', 'fb1c')})
      .then(() => {return this._startNotificationsForCharacteristic('fd21', 'fd22')})
      .then(() => {return this._startNotificationsForCharacteristic('fd21', 'fd23')})
      .then(() => {return this._startNotificationsForCharacteristic('fd21', 'fd24')})
      .then(() => {return this._startNotificationsForCharacteristic('fd51', 'fd52')})
      .then(() => {return this._startNotificationsForCharacteristic('fd51', 'fd53')})
      .then(() => {return this._startNotificationsForCharacteristic('fd51', 'fd54')})
      .then(() => {console.log('Finished starting notifications');})
      .catch((error) => {console.error('Failed to start notifications', error);});
  }

  _handshake() {
    console.log('Handshake');
    return this.droneDevice.gatt.connect().then(() => {
      return this._writeTo('fa00', 'fa0b', [4, ++this.steps.fa0b, 0, 4, 1, 0, 0x32, 0x30, 0x31, 0x34, 0x2D, 0x31, 0x30, 0x2D, 0x32, 0x38, 0x00]);
    });
  }

  _hover() {
    console.log('Hover');
    this.driveStepsRemaining = 0;
    this.speeds.yaw = 0;
    this.speeds.pitch = 0;
    this.speeds.roll = 0;
    this.speeds.altitude = 0;
  }

  _startPing() {
    console.log('Start ping');
    this.ping = setInterval(() => {
      this._writeTo('fa00', 'fa0a',
        [
          2,
          ++this.steps.fa0a,
          2,
          0,
          2,
          0,
          this.driveStepsRemaining ? 1 : 0,
          this.speeds.roll,
          this.speeds.pitch,
          this.speeds.yaw,
          this.speeds.altitude,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ])
        .catch(this._onBluetoothError.bind(this));

      if (this.driveStepsRemaining > 0) {
        this.driveStepsRemaining--;
        if (this.driveStepsRemaining === 0) {
          console.log('Move complete, reset to hover state');
          this._hover();
        } else {
          console.log('Drive steps remaining', this.driveStepsRemaining);
        }
      }
    }, 50);
  }

  _setSpeed(property, speed, driveSteps){
    console.log(`Change ${property} to ${speed}`);
    const props = ['yaw', 'pitch', 'roll', 'altitude'];
    
    for (let i=0; i < props.length; i++) {
      const prop = props[i];
      if (property === prop) {
        this.speeds[prop] = speed;
      } else {
        this.speeds[prop] = 0;
      }
      this.driveStepsRemaining = driveSteps;
    }
  }

  _setAdvancedSpeed(inputProperties, driveSteps) {    
    const allPropsAndSpeeds = {
      yaw: 0,
      pitch: 0,
      roll: 0,
      altitude: 0
    };
    for (const property in allPropsAndSpeeds) {
      if(inputProperties.hasOwnProperty(property)){
        this.speeds[property] = inputProperties[property]
      } else {
        this.speeds[property] = allPropsAndSpeeds[property]
      }
    }
    this.driveStepsRemaining = driveSteps;
  }

  _onBluetoothError(err) {
    console.error('Error!', err);
    clearInterval(this.ping);
  }

  connect(disconnectCallback) {
    this.onDisconnectCallback = disconnectCallback;
    return new Promise((resolve) => {

      console.log('Connect');
      return this._discover().then(() => {
        return this._connectGATT();
      }).then(() => {
        return this._startNotifications()
      }).then(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            this._handshake().then(resolve);
          }, 100);
        });
      }).then(() => {
        console.log('Completed handshake');
        resolve();
      });
    });
  };

  disconnect() {
    console.log('Disconnect');
    this.droneDevice.gatt.disconnect();
  };

  takeOff() {
    console.log('Take off...');
    return this.droneDevice.gatt.connect().then(() => {
      // "Flat trim" which you are meant to call before taking off
      return this._writeTo('fa00', 'fa0b', [2, ++this.steps.fa0b & 0xFF, 2, 0, 0, 0]);
    }).then(() => {
      // Actual command to take off
      return this._writeTo('fa00', 'fa0b', [4, ++this.steps.fa0b, 2, 0, 1, 0]);
    }).then(() => {
      this._startPing();
    })
      .catch(this._onBluetoothError.bind(this));
  };

  flip() {
    console.log('Flip...');
    return this.droneDevice.gatt.connect().then(() => {
      return this._writeTo('fa00', 'fa0b', [4, ++this.steps.fa0b, 2, 4, 0, 0, 2, 0, 0, 0]);
    })
    .catch(this._onBluetoothError.bind(this));
  };

  land() {
    console.log('Land...');
    return this.droneDevice.gatt.connect().then(() => {
      return this._writeTo('fa00', 'fa0b', [4, ++this.steps.fa0b, 2, 0, 3, 0]);
    }).then(() => {
      clearInterval(this.ping);
    })
    .catch(this._onBluetoothError.bind(this));
  };

  emergencyCutOff() {
    console.warn('Emergency cut off!');
    return this.droneDevice.gatt.connect().then(() => {
      return this._writeTo('fa00', 'fa0c', [0x02, ++this.steps.fa0c & 0xFF, 0x02, 0x00, 0x04, 0x00]);
    }).then(() => {
      clearInterval(this.ping);
    })
    .catch(this._onBluetoothError.bind(this));
  };

  hover() {
    this._hover();
  };

  moveForwards() {
    this._setSpeed('pitch', DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };

  moveBackwards() {
    this._setSpeed('pitch', -DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };

  moveLeft() {
    this._setSpeed('yaw', -DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };

  moveLeftForwards() {
    this._setAdvancedSpeed({pitch: DEFAULT_SPEED, roll: -DEFAULT_SPEED}, DEFAULT_DRIVE_STEPS);
  }
  
  // [pitch 30, roll 30] = 45 deg rechts
  // [pitch 30 , roll 0 ] = 0 deg vooruit
  // [pitch 30, roll -30] = 45 deg links
  // [pitch 0, roll ]
  

  moveRight() {
    this._setSpeed('yaw', DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };

  moveUp() {
    this._setSpeed('altitude', DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };

  moveDown() {
    this._setSpeed('altitude', -DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
  };
}

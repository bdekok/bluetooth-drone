# Bluetooth drone

Small React App that uses [Web Bluetooth](https://caniuse.com/#search=web%20bluetooth) to control a Parrot minidrone in combination with a PS4 controller (wired). 

*Please note that the firmware of the Parrot Minidrone has to be on 2.1.7 for now, and not on the latest firmware (2.6.8).*

![Flying drone through our office](https://raw.githubusercontent.com/bdekok/bluetooth-drone/master/drone.gif)

## To Run 

1. npm i 
2. npm run start
3. open and connect PS4 controller &amp; drone;

## Controls 

It is direction stearing, I've combined the roll, yawn and pitch for stearing with only the left controller stick. (This is how my brain worked).

```
Left controller stick : Stearing 
Left up and down button : Up and down
O Button : Land
X Button : Lift off 
▲ Button : Flip
```
## Thanks to

* [Niels Leenheer's awesome Bluetooth Rocks project & presentation](https://github.com/BluetoothRocks/Drone)
* [Poshaughnessy for the original work on the drone](https://github.com/poshaughnessy/web-bluetooth-parrot-drone)
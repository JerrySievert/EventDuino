var eventduino = require('../lib/index');

var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });

function convertToCelsius (RawADC) {
 var temp;

 temp = Math.log(((10240000/RawADC) - 10000));
 temp = 1 / (0.001129148 + (0.000234125 * temp) + (0.0000000876741 * temp * temp * temp));
 temp = temp - 273.15;

 return temp;
}

ardy.on('watch', function (args) {
  console.log('Temperature: ' + convertToCelsius(args[1]));
});

ardy.on('init', function (args, comment) {
  console.log('Eventduino init version ' + comment);
  
  // set a watch on pin 5, with a variance of 5
  ardy.watch(eventduino.A5, 5);
});
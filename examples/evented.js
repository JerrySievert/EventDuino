var eventduino = require('../lib/index');

var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });

ardy.on('pong', function () {
  console.log('Received a pong');
});

ardy.on('watch', function (args) {
  console.log('pin ' + args[0] + ' => ' + args[1]);
});

ardy.on('init', function (args, comment) {
  console.log('Eventduino init version ' + comment);
  
  console.log("Sending ping");
  ardy.ping();
});
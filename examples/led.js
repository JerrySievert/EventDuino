var eventduino = require('../lib/index');

var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });

ardy.on('init', function (args, comment) {
  console.log('Eventduino init version ' + comment);

  var i = 0;

  var blinker = function () {
    if (i%2) {
      ardy.set(13, 1023);
    } else {
      ardy.set(13, 0);
    }
    i++;
    
    setTimeout(blinker, 1000);
  };
  
  blinker();
});
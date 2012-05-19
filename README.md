# EventDuino

An event-driven Arduino to Node.js adapter.

Support is pretty basic so far:

* Arduino sketch with an event loop
* Extendable protocol
* Basic events
* Reading and writing of pins
* Watching pins for changes and emitting events

## Installing

    $ npm install eventduino

## On the Arduino

Compile and upload the `sketch` in `src/eventdu`.  This `sketch` listens for commands and watches for changes to pins via the `watch` command.

The bulk of the `sketch` is the parser.

## Protocol

The protocol is very minimal.  It includes a `command`, up to `ten` arguments, and optional comments.  Total packet size is currently limited to `1024 bytes`.

Currently defined commands and responses:
* INIT - Returned from the Arduino upon init, emits `init`
* ERROR - Returned from the Arduino upon error, emits `exception`
* PING - Sends a ping packet to the Arduino
* PONG - Returned from the Arduino from a ping, emits `pong`
* GET - Send and receive, emits `get`, arguments are the `pin` and the `value`
* SET - Sends a set packet, arguments are the `pin` and the `value`
* WATCH - Tells the Arduino to watch for a change on a `pin`, emits `watch` with a`pin` and `value` on change
* UNWATCH - Tells the Arduino to stop watching for a change on a `pin`
* OK - Ok!

````
      <packet> ::= <command> <argument> <comment> <EOL>
    
     <command> ::= [0-9a-zA-Z][0-9a-zA-Z]
    
    <argument> ::= <NULL>
                 | [0-9]+ ':' [0-9a-zA-Z]+
                 | <argument>
                 
     <comment> ::= <NULL>
                 | '#' [0-9a-zA-Z]+
````

## Basic Events

The event system is pretty straightforward.  On initialization an `init` event is emitted, at which point further commands can executed.

    var eventduino = require('eventduino');
    
    var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });
    
    ardy.on('pong', function () {
      console.log("PONG!");
    });
    
    ardy.on('init', function (args, comment) {
      console.log('Eventduino init version ' + comment);
      ardy.ping();
    });

## Getting and Setting

Getting and setting of `pins` is very simple.  The pin mode is changed automatically.

    var eventduino = require('eventduino');
    
    var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });
    
    ardy.on('get', function (args) {
      console.log("pin " + args[0] + " is set to " + args[1]);
    });
    
    ardy.on('init', function (args, comment) {
      console.log('Eventduino init version ' + comment);
    
      // get the value of pin 1
      ardy.get(1);
    
      // set the LED pin to HIGH (1)
      ardy.set(13, 1);
    });

## Watching for Changes

Eventduino can be set into watch mode, which will check for any changes to the `pin` and send a command if one occurs.  A `watch` can be setup on as many `pins` as required.

    var eventduino = require('eventduino');
    
    var ardy = new eventduino({ serialport: '/dev/tty.usbmodemfa131' });
    
    ardy.on('watch', function (args) {
      console.log("pin " + args[0] + " is now set to " + args[1]);
      
      // stop watching pin 5 on first change
      if (args[0] === 5) {
        ardy.unwatch(5);
        ardy.set(13, 1);
      }
    });
    
    ardy.on('init', function (args, comment) {
      console.log('Eventduino init version ' + comment);
    
      ardy.watch(1);
      ardy.watch(5);
    });

## TODO

Implement analog pins.

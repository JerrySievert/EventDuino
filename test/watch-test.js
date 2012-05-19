var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Watch').addBatch({
  'when a watch is returned': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      var t = new ed({ rawserial: rawserial.left });

      t.on('watch', function (args) {
        self.callback(undefined, args, mockarduino);
      });

      t.send(t.WATCH, [ "1" ], "23");
    },
    'the correct event is emitted': function (err, topic, mock) {
      assert.equal(topic[0], 1);
      assert.equal(topic[1], 23);
    }
  }
}).export(module);
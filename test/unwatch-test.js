var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Unwatch').addBatch({
  'when an unwatch is sent': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      var t = new ed({ rawserial: rawserial.left });

      t.on('ok', function (args) {
        self.callback(undefined, 'ok');
      });

      t.send(t.UNWATCH, [ "1" ]);
    },
    'the correct event is emitted': function (err, topic) {
      assert.equal(topic, 'ok');
    }
  }
}).export(module);
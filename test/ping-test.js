var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Ping').addBatch({
  'when a ping is emitted': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      var t = new ed({ rawserial: rawserial.left });

      t.on('pong', function () {
        self.callback(undefined, true);
      });

      t.send(t.PING);
    },
    'a pong is returned': function (err, data) {
      assert.equal(data, true);
    }
  }
}).export(module);
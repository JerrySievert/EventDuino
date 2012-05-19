var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Set').addBatch({
  'when a set is sent': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      var t = new ed({ rawserial: rawserial.left });

      t.send(t.SET, [ 1, 2 ]);
      return mockarduino.ds[1];
    },
    'the correct value is set': function (topic) {
      assert.equal(topic, 2);
    }
  }
}).export(module);
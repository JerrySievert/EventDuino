var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Init').addBatch({
  'when init is fired': {
    topic: function() {
      var self = this;

      var rawserial   = new serial();

      var t = new ed({ rawserial: rawserial.left });

      t.on('init', function (args) {
        self.callback(undefined, 'init');
      });

      var mockarduino = new arduino(rawserial.right);
    },
    'the correct event is emitted': function (err, topic) {
      assert.equal(topic, 'init');
    }
  }
}).export(module);
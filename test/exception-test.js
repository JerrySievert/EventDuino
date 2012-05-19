var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Error').addBatch({
  'when an error is raised': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      var t = new ed({ rawserial: rawserial.left });

      t.on('exception', function () {
        self.callback(undefined, "exception");
      });

      t.send("FOO");
    },
    'the error gets emitted': function (err, topic) {
      assert.equal(topic, "exception");
    }
  }
}).export(module);
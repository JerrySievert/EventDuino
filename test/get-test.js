var assert  = require('assert'),
    vows    = require('vows'),
    serial  = require('./mock/serial'),
    arduino = require('./mock/arduino'),
    ed      = require('../lib/index');


vows.describe('Get').addBatch({
  'when a get is sent': {
    topic: function() {
      var self = this;

      var rawserial   = new serial(),
          mockarduino = new arduino(rawserial.right);

      mockarduino.ds[1] = "23";

      var t = new ed({ rawserial: rawserial.left });

      t.on('get', function (args, comment) {
        self.callback(undefined, args);
      });

      t.send(t.GET, [ "1" ]);
    },
    'the correct value is returned': function (err, args) {
      assert.equal(args[0], 1);
      assert.equal(args[1], 23);
    }
  }
}).export(module);
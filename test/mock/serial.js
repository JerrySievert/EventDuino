var events = require('events');

function MockSerial (device) {
  var self = this;
  
  self.left = new events.EventEmitter();
  self.right = new events.EventEmitter();
  
  self.left.write = function (data) {
    self.right.emit('data', data);
  };
  self.right.write = function (data) {
    self.left.emit('data', data);
  };

  events.EventEmitter.call(self);
  
  self.device = device;
}

exports = module.exports = MockSerial;
const INIT       = "00";
const ERROR      = "01";
const PING       = "02";
const PONG       = "03";
const GET        = "04";
const SET        = "05";
const WATCH      = "06";
const UNWATCH    = "07";
const OK         = "23";

function MockArduino (serial) {
  var self = this;

  self.sp = serial;
  
  self.sp.on('data', function (data) {
    self.parse(data);
  });

  self.dw = [
    false, false, false, false,
    false, false, false, false,
    false, false, false, false,
    false, false
  ];
  self.ds = [ ];

  self.aw = [ false, false, false, false, false, false ];
  self.as = [ ];

  
  self.parse = function (data) {
    data = data.replace("\n", "");
    var command;
    var args = [ ];
    var comment;
    
    if (data.length < 2) {
      self.write(self.ERROR, [ "Unknown Packet", data ]);
    }

    command = data.substring(0, 2);
    data = data.substring(2);

    var count = 0;
    var pos = 0;
    while (pos < data.length) {
      // comment
      if (data[pos] == '#') {
        comment = data.substring(pos + 1);
        break;
      }

      // delimiter
      else if (data[pos] == ':') {
        var scount = 0;
        var ssize = "";

        args[count] = "";
        pos++;

        while (data[pos] != ':') {
          ssize += data[pos];
          scount++;
          pos++;
          
          if (scount == 5) {
            self.write(ERROR, [ "Argument Too Long", data ]);
            return;
          }
        }

        if (scount) {
          if (parseInt(ssize) >= self.MAX_BUFFER) {
            self.write(ERROR, [ "Argument Too Long", data ]);
            return;
          }

          pos++;
          args[count] = "";

          for (var i = pos; i < pos + parseInt(ssize); i++) {
            args[count] += data[i];
          }
          
          count++;

          pos += parseInt(ssize) - 1;
        }
      } else {
        self.write(ERROR, [ "Invalid Argument", count ]);
        return;
      }

      pos++;
    }    

    switch (command) {
      case PING:
        self.write(PONG);
        break;

      case PONG:
        break;

      case ERROR:
        self.write(ERROR, [ data ]);
        break;

      case GET:
        self.write(GET, [ args[0], self.ds[parseInt(args[0])] ]);
        break;

      case SET:
        self.ds[parseInt(args[0])] = args[1];
        self.write(OK);
        break;
      
      case WATCH:
        self.ds[parseInt(args[0])] = comment;
        self.dw[parseInt(args[0])] = true;

        self.write(OK);
        self.write(WATCH, [ args[0], self.ds[parseInt(args[0])] ]);
        break;

      case UNWATCH:
        self.write(OK);
        break;
      
        
      default:
        console.log("arduino default: " + command + " => " + data);
        self.write(ERROR, [ "Unknown Command", command ]);
    }
  };

  self.write = function (command, data, comment) {
    var packet = command;

    for (var i = 0; data && i < data.length; i++) {
      packet += ':' + data[i].length + ':' + data[i];
    }
    
    if (comment) {
      packet += '#' + comment;
    }
    
    packet += "\n";

    self.sp.write(packet);
  };


  self.write(INIT, [ ], 'Mock');
}

exports = module.exports = MockArduino;
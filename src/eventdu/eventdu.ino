#define VERSION    "v0.1.2"

#define INIT       "00"
#define ERROR      "01"
#define PING       "02"
#define PONG       "03"
#define GET        "04"
#define SET        "05"
#define WATCH      "06"
#define UNWATCH    "07"
#define OK         "23"

#define MAX_BUFFER 1024
#define MAX_ARGS   10

// digital watch
int d[14];
int wd[14];
// analog watch
int a[6];
int wa[6];
// analog variance
int va[6];

#include <stdarg.h>

// sprintf kept failing, this is a hacked up copy
// note the malloc(), so there must be an accompanying free()
char *p (char *fmt, ... ){
  char *tmp = (char *) malloc(sizeof(char) * 128);
  va_list args;
  va_start (args, fmt );
  vsnprintf(tmp, 128, fmt, args);
  va_end (args);

  return tmp;
}

void setup () {
  // initialize serial communication at 115200 bits per second
  Serial.begin(115200);
  Serial.println();
  
  int i;

  // set up the watchers
  for (i = 0; i < 14; i++) {
    d[i] = 0;
    wd[i] = 0;
    
    if (i < 6) {
      a[i] = 0;
      wa[i] = 0;
      va[i] = 0;
    }
  }
  
  write(INIT, NULL, 0, VERSION);
}

void loop () {
  // serial read and command processing loop
  read();

  int i;

  // check for the watchers, write any changes
  for (i = 0; i < 14; i++) {
    if (wd[i]) {
      int c = digitalRead(i);
      
      if (c != d[i]) {
        d[i] = c;
        
        char *data[2];
        
        data[0] = p("%d", i);
        data[1] = p("%d", c);
        
        write(WATCH, data, 2, NULL);
        
        free(data[0]);
        free(data[1]);
      }
    }

    if (i < 6) {
      if (wa[i]) {
        int ar = analogRead(i);
        
        if (ar != a[i] && abs(ar - a[i]) > va[i]) {
          a[i] = ar;
          
          char *data[2];
          
          data[0] = p("A%d", i);
          data[1] = p("%d", ar);
          
          write(WATCH, data, 2, NULL);
          
          free(data[0]);
          free(data[1]);
        }
      }
    }
  }
}

// find the real pin
int realPin (char *pin) {
  if (pin[0] == 'A') {
    switch (pin[1]) {
      case '0':
      return A0;

      case '1':
      return A1;

      case '2':
      return A2;

      case '3':
      return A3;

      case '4':
      return A4;

      case '5':
      return A5;
      
      default:
      return -1;
    }
  }

  return atoi(pin);
}

// build the packet and send via serial
void write (char *command, char **args, int count, char *comment) {
  int i;

  Serial.write(command);

  if (args && count) {
    for (i = 0; i < count; i++) {
      Serial.write(":");
      Serial.print(strlen(args[i]));
      Serial.write(":");
      Serial.write(args[i]);
    }
  }
  
  if (comment) {
    Serial.write("#");
    Serial.write(comment);
  }
  
  Serial.write("\n");
}

// read any packets waiting, yielding every 10 characters
void read () {
  static char buffer[MAX_BUFFER];
  static int index = 0;
  static int count = 0;
  
  while (Serial.available() > 0 && count < 10) {
    if (index >= MAX_BUFFER) {
      char *data[1];
      
      data[0] = "Maximum Buffer Size Exceeded";
      write(ERROR, data, 1, NULL);
      
      index = 0;
      count = 0;
      
      return;
    }

    buffer[index] = Serial.read();

    if (buffer[index] == '\n') {
      buffer[index] = '\0';
      
      execute(buffer);

      index = 0;

      return;
    }

    index++;
    count++;
  }

  count = 0;
}

// parse the packet and execute the commands
void execute (char *buffer) {
  char command[3];
  char *args[MAX_ARGS];
  int count = 0;

  if (strlen(buffer) < 2) {
    char *data[2];
      
    data[0] = "Malformed Command";
    data[1] = buffer;
    write(ERROR, data, 2, NULL);
  } else {
    command[0] = buffer[0];
    command[1] = buffer[1];
    command[2] = '\0';

    int pos = 2;
    int length = strlen(buffer);

    while (count < MAX_ARGS && pos < length) {
      // comment
      if (buffer[pos] == '#') {
        break;
      }

      // delimiter
      else if (buffer[pos] == ':') {
        char ssize[5];
        int scount = 0;

        pos++;

        // read the length of the argument
        while (buffer[pos] != ':') {
          ssize[scount] = buffer[pos];
          scount++;
          pos++;
          
          if (scount == 5) {
            char *data[2];
            
            data[0] = "Argument Too Long";
            data[1] = buffer;
            
            write(ERROR, data, 2, NULL);
            cleanup(args, count);
            
            return;
          }
        }

        if (scount) {
          if (atoi(ssize) >= MAX_BUFFER) {
            char *data[2];
            
            data[0] = "Argument Too Long";
            data[1] = buffer;
            
            write(ERROR, data, 2, NULL);
            cleanup(args, count);
            
            return;
          }

          pos++;
          int i;

          ssize[scount] = '\0';

          // allocate and copy the argument now that we have the size
          args[count] = (char *) malloc(sizeof(char) * (atoi(ssize) + 1));

          for (i = pos; i < pos + atoi(ssize); i++) {
            args[count][i - pos] = buffer[i];
          }
          
          args[count][i - pos] = '\0';

          count++;
          pos += atoi(ssize) - 1;
        }
      } else {
        char *data[2];
        
        data[0] = "Invalid Argument";
        data[1] = p("%d", count);

        write(ERROR, data, 2, NULL);

        cleanup(args, count);
        free(data[1]);

        return;
      }

      pos++;
    }
    
    if (strcmp(command, PING) == 0) {
      cmd_ping();
    } else if (strcmp(command, GET) == 0) {
      cmd_get(args, count);
    } else if (strcmp(command, SET) == 0) {
      cmd_set(args, count);
    } else if (strcmp(command, WATCH) == 0) {
      cmd_watch(args, count);
    } else if (strcmp(command, UNWATCH) == 0) {
      cmd_unwatch(args, count);
    } else {
      char *data[2];
      
      data[0] = "Unknown Command";
      data[1] = command;

      write(ERROR, data, 2, NULL);
    }
    
    cleanup(args, count);
  }
}

// free up any memory allocated from the packet
void cleanup (char **args, int count) {
  int i;
  for (i = 0; i < count; i++) {
    if (args[i] != NULL) {
      free(args[i]);
    }
  }
}

void cmd_ping () {
  write(PONG, NULL, 0, NULL);
}

void cmd_get (char **args, int count) {
  int pin = realPin(args[0]);
  pinMode(pin, INPUT);

  char *data[2];
  data[0] = args[0];

  if (args[0][0] != 'A') {
    int current = digitalRead(pin);
    data[1] = p("%d", current);

  } else {
    int current = analogRead(pin);
    
    data[1] = p("%d", current);
  }

  write(GET, data, 2, NULL);
  free(data[1]);
}

void cmd_set (char **args, int count) {
  int pin = realPin(args[0]);
  pinMode(pin, OUTPUT);

  if (args[0][0] != 'A') {
    digitalWrite(pin, atoi(args[1]));
    wd[atoi(args[0])] = 0;
  } else {
    analogWrite(pin, atoi(args[1]));
    wa[atoi(args[0])] = 0;
  }

  write(OK, NULL, 0, NULL);
}

void cmd_watch (char **args, int count) {
  int pin = realPin(args[0]);
  pinMode(pin, INPUT);

  if (args[0][0] != 'A') {
    wd[pin] = 1;
    d[pin] = digitalRead(pin);
  } else {
    wa[atoi(&args[0][1])] = 1;
    a[atoi(&args[0][1])] = analogRead(pin);
    if (count == 2) {
      va[atoi(&args[0][1])] = atoi(args[1]);
    } else {
      va[atoi(&args[0][1])] = 0;
    }
  }

  write(OK, NULL, 0, NULL);
}

void cmd_unwatch (char **args, int count) {
  if (args[0][0] != 'A') {
    wd[atoi(args[0])] = 0;
  } else {
    wa[atoi(&args[0][1])] = 0;
  }
  
  write(OK, NULL, 0, NULL);
}

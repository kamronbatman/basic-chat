var net = require('net');

module.exports = function(chatServer) {
  var TelnetInput = require('telnet-stream').TelnetInput;
  var TelnetOutput = require('telnet-stream').TelnetOutput;

  var telnetServer = net.createServer(newConnection);

  // Initialize our telnet server
  console.log('Telnet server listening on port', process.env.telnetPort);
  telnetServer.listen(process.env.telnetPort);

  function newConnection(connection) {

    var telnetInput = new TelnetInput();
    var telnetOutput = new TelnetOutput();

    connection.pipe(telnetInput);
    telnetOutput.pipe(connection);

    // Make it compatible with the chat system we created
    var socket = {
      emit: function (command, data) {
        if (!socket.disconnected) {
          telnetOutput.write(data + '\n');
        }
      },
      end: function () {
        chatServer.emit(socket, 'disconnect');
        connection.end();
      }
    };

    // Send incoming data to the chat system.
    telnetInput.on('data', function(data) {
      //console.log('Data found!', data);

      var string = data.toString().trim();
      //console.log('String Found!', string);
      if (string.length) {
        chatServer.emit(socket, 'message', string);
      }
    });

    telnetInput.on('command', function(command) {
      //console.log('Command!!!', command);

      // Disconnect commands
      if (command == 244 || command == 237) { socket.end(); }
    });

    connection.on('end', function() {
      if (!socket.disconnected) {
        chatServer.emit(socket, 'disconnect');
      }
    });

    connection.on('error', function(error) {
      console.log('Socket error!', error);
      if (!socket.disconnected) {
        chatServer.emit(socket, 'disconnect');
      }
    })

    // Register the connection and attach it to the chat system.
    chatServer.newConnection(socket);
  }
};
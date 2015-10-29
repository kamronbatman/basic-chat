var _ = require('lodash');

// new ChatServer()
module.exports = ChatServer;


function ChatServer() {
  this.rooms = new Map();
  this.sockets = new Map();
  this.eventHandlers = new Map();

  // Commands our users can use
  this.commands = {
    msg: this.msg,
    rooms: this.listRooms,
    join: this.join,
    leave: this.leave,
    leaveAll: this.leaveAll,
    quit: this.quit,
    nick: this.nick
  };

  // Our message handler, for user input
  this.on('message', function(socket, data) {
    // Are we prompting for a username?
    if (!socket.userName) {
      this.setUserName(socket, true, data);
    }
    // Does it start with a slash? Then it is a command!
    else if (data.startsWith('/')) {

      // Get the first space in our data
      var space = data.indexOf(' ');
      if (space === -1) { space = data.length; }

      // Get the handler for our command
      var command = this.commands[data.substr(1,space-1)];

      // Does our command exist? If so, execute it
      // Otherwise, we assume it is a message to the current channel
      if (command) { command.bind(this)(socket, data.substr(space+1)); }
      else { socket.emit('message', '<= The command ' + data + ' does not exist!'); }

    }
    else { this.commands.msg.bind(this)(socket, socket.currentRoom + ' ' + data); }
  }.bind(this));

  this.on('disconnect', function(socket) {
    this.leaveAll(socket);
    socket.emit('message', '<= We will miss you! Bye!');

    if (socket.userName) {
      this.sockets[socket.userName.toLowerCase().trim()] = undefined;
    }

    socket.disconnected = true;
  }.bind(this));
};

// Accept a generic socket object.
// This object must have a .emit, and utilize the handler.on function provided below
ChatServer.prototype.newConnection = function(socket) {
  //socket.userName = 'Kamron' + Math.random();
  socket.rooms = new Set();
  socket.emit('message', '<= Welcome to a basic chat!');
  socket.emit('message', '<= What is your name?');
  //this.commands.join.bind(this)(socket, '#lobby');
};

ChatServer.prototype.setUserName = function(socket, newUser, data) {
  // People aren't channels silly!
  if (data.startsWith('#')) {
    socket.emit('message', '<= Sorry, names cannot start with a "#".');
  } else if (this.getSocket(data) === socket) {
    socket.emit('message', '<= You are already known as ' + socket.userName);
  } else if (this.getSocket(data)) {
    socket.emit('message', '<= Sorry, someone is using that name!');
  } else {
    this.sockets[data.toLowerCase().trim()] = socket;
    socket.userName = data;
    if (newUser) {
      socket.emit('message', '<= Welcome ' + socket.userName);
    } else {
      socket.emit('message', '<= You are now known as ' + socket.userName);
    }
    if (newUser) {
      this.join(socket, '#lobby');
    }
  }
};

ChatServer.prototype.on = function(event, handler) {
  // Either we have a Set object, or we initialize one.
  var events = this.eventHandlers[event] || (this.eventHandlers[event] = new Set());

  // Add our event to the events Set object.
  events.add(handler);
};

// Emit the specified event
ChatServer.prototype.emit = function(socket, command, data) {
  var events = this.eventHandlers[command];
  if (events) {
    events.forEach( function(event) {
      event(socket, data);
    });
  }
};

// Get the user's socket by username
ChatServer.prototype.getSocket = function(username) {
  var username = username.toLowerCase().trim();

  return _.reduce(this.sockets, function(memo, user, key) {
    return key === username ? user : null;
  }, null);
};

// Used for private message
ChatServer.prototype.emitToUser = function(socket, userName, data) {
  var user = this.getSocket(userName);

  if (user) {
    user.emit('message', userName + ' <= ' + socket.userName + ': ' + data);
    socket.emit('message', socket.userName + ' => ' + userName + ': ' + data);
  } else { return 'That user does not exist.'; }
};

ChatServer.prototype.emitToRoom = function(socket, roomName, data) {
  var room = this.rooms.get(roomName) || [];

  room.forEach(function(user) {
    // System messages, where socket is null, will be sent to everyone, raw
    if (socket) {
      if (socket === user) {
        socket.emit('message', socket.userName + ' => ' + roomName + ': ' + data);
      } else {
        user.emit('message', roomName + ' <= ' + socket.userName + ': ' + data);
      }
    } else { user.emit('message', data); }
  });
};

ChatServer.prototype.inRoom = function(socket, roomName) {
  return socket.rooms.has(roomName.toLowerCase().trim());
};

// Message a room or user
ChatServer.prototype.msg = function(socket, data) {
  var space = data.indexOf(' ');
  if (space < 0) {
    socket.emit('message', '<= Invalid parameters. /msg <room|user> message');
  } else {
    var to = data.substr(0,space);
    if (to && to.length) {
      var msg = data.substr(space+1);
      if (this.inRoom(socket, to)) {
        this.emitToRoom(socket, to, msg);
      } else if (to.startsWith('#')) { socket.emit('message', '<= You are not in that room.'); }
      else {
        var error = this.emitToUser(socket, to, msg);
        if (error) { socket.emit('message', error); }
      }
    }
  }
};

// List out all rooms
ChatServer.prototype.listRooms = function(socket) {
  socket.emit('message', '<= Active Rooms');
  this.rooms.forEach( function(users, roomName) {
    // Only list rooms that have people in it.
    if (users.size) {
      socket.emit('message', '<= ' + roomName + ' (' + users.size + ')' );
    }
  });
  socket.emit('message', '<= End of List');
};

// Join a room
ChatServer.prototype.join = function(socket, data) {
  // We will default all chat rooms with #, like in IRC
  if (!(data && data.startsWith('#'))) {
    data = '#' + data;
  }

  // Standardize it
  data = data.toLowerCase().trim();

  // If the room doesn't exist, create it.
  var room = this.rooms.get(data);
  if (!room) {
    this.rooms.set(data, room = new Set());
  }

  // Add the user to the room.
  room.add(socket);

  // You can be in multiple rooms, but if you don't specify, then this is it.
  socket.currentRoom = data;
  // Add it to the set!
  socket.rooms.add(data);

  this.emitToRoom(null, data, '<= ' + socket.userName + ' joined ' + data);
};

// leave a room
ChatServer.prototype.leave = function(socket, data) {
  if (!(data && data.length)) {
    data = socket.currentRoom;
  }

  // Standardize it
  data = data.toLowerCase().trim();

  if (data && data.length) {
    if (socket.rooms.has(data)) {
      var room = this.rooms.get(data);
      room.delete(socket);
      socket.rooms.delete(data);
      socket.emit('message', '<= You left ' + data);
      this.emitToRoom(null, data, '<= ' + socket.userName + ' left ' + data);
    } else { socket.emit('message', '<= You are not in that chatroom'); }
  } else {
    socket.emit('message', '<= You are not in a chatroom');
  }
};

// leave all rooms
ChatServer.prototype.leaveAll = function(socket) {
  socket.rooms.forEach( function(roomName) {
    this.leave(socket, roomName);
  }.bind(this));
};

// Quit! Oh no! Fine, let's be gracious! :)
ChatServer.prototype.quit = function(socket) {
  socket.end();
}

// Change our name!
ChatServer.prototype.nick = function(socket, data) {
  this.setUserName(socket, false, data);
}
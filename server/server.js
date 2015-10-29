process.isDev = function () { return process.env.NODE_ENV === 'development'; };
process.isProd = function () { return process.env.NODE_ENV === 'production'; };

require('dotenv').load();

if (process.isDev()) { process.env.port = process.env.portDev }

// Initialize our Chat Server
var ChatServer = require('./chat/chat');

// Let's create our server!
var chatServer = new ChatServer();

// Initialize the Telnet server that will work with the Chat Server
require('./chat/telnet')(chatServer);
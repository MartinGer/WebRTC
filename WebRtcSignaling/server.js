'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080, "0.0.0.0");

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

  socket.on('message', function(message) {
    
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {

    var numClients = io.sockets.sockets.length;

    if (numClients === 1) {
      socket.join(room);
      socket.emit('created', room, socket.id);

    } else {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
    } 
  });
});

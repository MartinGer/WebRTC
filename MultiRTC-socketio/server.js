'use strict';
//strg+k+c
var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080, "0.0.0.0");

var io = socketIO.listen(app);
var users = [];

io.sockets.on('connection', function(socket) {

  socket.on('message', function(userId) {
    socket.broadcast.emit('message', userId);
 });

  socket.on('private message', function(message, fromUserId, toUserId) {  
    socket.to(toUserId).emit('private message', message, fromUserId, toUserId);   
  });

  socket.on('create or join', function(room) {

    var numClients = io.sockets.sockets.length;

    if (numClients === 1) {
      socket.join(room);
      io.sockets.in(room).emit('created', room, socket.id);
      users.push(socket);
    } else {
      socket.join(room);
      io.sockets.in(room).emit('joined', room, numClients, socket.id);
      users.push(socket);
    } 
  });

  //private connection between first user and the joining user
  socket.on('exchange Id', function(id) {
    socket.to(users[0].id).emit('newId', id); 
    io.to(id).emit('newId', users[0].id); 
  });
});

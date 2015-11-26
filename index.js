var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket) {
  socket.on('value-changed', function(msg) {
    socket.broadcast.emit('value-changed', msg);
  });
});

http.listen(6565, function() {
  console.log('listening on *:6565');
});

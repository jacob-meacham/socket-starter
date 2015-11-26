var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'public/index.html');
});

io.on('connection', function(socket) {
  socket.on('value-changed', function(msg) {
    console.log('got value changed');
    console.log(msg);
    socket.broadcast.emit('value-changed', msg);
  });
});

http.listen(6565, function() {
  console.log('listening on *:6565');
});

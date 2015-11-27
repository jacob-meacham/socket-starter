var express = require('express');
var app = express();
var http = require('http').Server(app);

// TODO: Use socket.io, which requires swift on the ios side, but would make all of this code
// not necessary.
var io = require('websocket.io').attach(http);

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'public/index.html');
});

var clients = [];
function broadcast(msg, socket) {
  clients.forEach(function(client) {
    if (client === socket) {
      return;
    }

    client.send(msg);
  })
}

function addClient(socket) {
  for (client in clients) {
    if (client === socket) {
      return; // Already in the list
    }
  }

  clients.push(socket);
}

function removeClient(socket) {
  clients.filter(function(client) {
    return (client !== socket);
  });
}

io.on('connection', function(socket) {
  addClient(socket);
  broadcast(JSON.stringify({'clientConnections': clients.length}));

  socket.on('message', function(msg) {
    broadcast(msg, socket);
  });

  socket.on('close', function () {
    removeClient(socket);
    broadcast(JSON.stringify({'clientConnections': clients.length}));
  });
});

http.listen(6565, function() {
  console.log('listening on *:6565');
});

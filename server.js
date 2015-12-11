var express = require('express');
var app = express();
var http = require('http').Server(app);

// TODO: Use socket.io, which requires swift on the ios side, but would make all of this code
// not necessary.
var io = require('websocket.io').attach(http);

var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name !== process.env.ADMIN_USER || user.pass !== process.env.ADMIN_PASSWORD) {
    return unauthorized(res);
  }

  return next();
}

app.use([auth, express.static('public')]);

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
  clients = clients.filter(function(client) {
    return (client !== socket);
  });
}

io.on('connection', function(socket) {
  addClient(socket);
  broadcast(JSON.stringify({'clientConnections': clients.length}));

  socket.on('message', function(msg) {
    broadcast(msg, socket);
  });

  socket.on('close', function() {
    removeClient(socket);
    broadcast(JSON.stringify({'clientConnections': clients.length}));
  });

  socket.on('error', function(error) {
    // Remove the socket in an error case
    removeClient(socket);
    broadcast(JSON.stringify({'clientConnections': clients.length}));
  })
});

var port = process.env.PORT || 6565;
var hostname = process.env.HOST || process.env.HOSTNAME || '0.0.0.0';
http.listen(port, hostname, function() {
  console.log('listening on ' + hostname + ':' + port);
});

const static = require('node-static');
const http = require('http');

const file = new (static.Server)();

const app = http.createServer(function(req, res) {
  file.serve(req, res);
}).listen(2013);

const io = require('socket.io').listen(app);
io.sockets.on('connection', function(socket) {
  function log() {
    const array = ['>>> Message from server: '];
    for (var i = 0; i < arguments.length; ++i) {
      array.push(arguments[i]);
    }

    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Got message:', message);
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    var clientsInroom = io.sockets.adapter.rooms[room];
    var numClients = clientsInroom ? Object.keys(clientsInroom.sockets).length : 0;
    log('Room ' + room + ' has ' + numClients + ' client(s)');
    log('Request to create or join room ' + room);

    if (numClients === 0) {
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients === 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else {
      socket.emit('full', room);
    }

    socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
    socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
  })
});
'use strict';

(function() {
  var isInitiator;

  const room = prompt('Enter room name:');

  const socket = io.connect();

  if (room !== '') {
    console.log('Joininig room ' + room);
    socket.emit('create or join', room);
  }

  socket.on('full', function(room) {
    console.log('Room ' + room + ' is full');
  })

  socket.on('empty', function(room) {
    isInitiator = true;
    console.log('Room ' + room + ' is empty');
  })

  socket.on('join', function(room) {
    console.log('Making request to join room ' + room);
    console.log('You are the initiator!');
  })

  socket.on('log', function(array) {
    console.log.apply(console, array);
  })
})();
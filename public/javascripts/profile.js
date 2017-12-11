var socket = io();
socket.emit('Handshake++', 'Ping');
socket.on('Handshake++', function(data) {
  console.log(data);
});

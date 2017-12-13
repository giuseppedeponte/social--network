var socket = io();
socket.emit('Handshake++', 'Ping');
socket.on('Handshake++', function(data) {
  console.log(data);
});

// prevent friendSearch form from submitting
$(function() {

  $('#friendSearchForm').on('submit', function(e) {
    e.preventDefault();
    var q = $(this).serialize();
    console.log(q);
    socket.emit('friendSearch', q);
  });
  socket.on('friendSearch', function(result) {
    console.log(result);
  });

});

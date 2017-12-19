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
  socket.on('friendSearch', function(users) {
    $('.friendSearchItem').remove();
    for (var i = 0; users[i]; i++) {
      $(
        $('#friendSearchItem')
        .prop('outerHTML')
        .replace(new RegExp('{{ name }}', 'g'), users[i].name || users[i].email)
        .replace(new RegExp('{{ id }}', 'g'), users[i]._id)
      )
      .addClass('friendSearchItem')
      .insertAfter('#friendSearchItem')
      .addClass('d-flex')
      .removeClass('d-none');
    }
    console.log(users);
  });

});

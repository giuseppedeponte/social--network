var socket = io();
socket.emit('Handshake++', 'Ping');
socket.on('Handshake++', function(data) {
  console.log(data);
});

$(function() {
  // BLOGGING
  $('#createPost').on('submit', function(e) {
    e.preventDefault();
    if ($('#postText').val().trim() === '') {
      return;
    }
    socket.emit('createPost', $(this).serialize());
  });
  socket.on('createPost', function(data) {
    console.log(data);
  });
  // FRIEND SEARCH
  $('#friendSearchInfo small a').click(function(e) {
    e.preventDefault();
    $('#friendSearch').val('');
    $('.friendSearchItem').remove();
    $('#friendSearchInfo small').addClass('invisible');
    $('#friendSearchInfo small span').text('');
  });
  $('#friendSearchForm').on('submit', function(e) {
    e.preventDefault();
    if ($('#friendSearch').val().trim() === '') {
      $('.friendSearchItem').remove();
      $('#friendSearchInfo small').addClass('invisible');
      $('#friendSearchInfo small span').text('');
      return;
    }
    var q = $(this).serialize();
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
    $('#friendSearchInfo small span').text(users.length + ' utilisateurs trouvés.');
    $('#friendSearchInfo small').removeClass('invisible');
    console.log(users);
  });

});

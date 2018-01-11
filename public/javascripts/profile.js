var socket = io();
socket.emit('Handshake++', 'Ping');
socket.on('Handshake++', function(data) {
  console.log(data);
});

$(function() {
  // BLOGGING
  $('#createPost').on('submit', function(e) {
    var userId = '&userId=' + this.action.split('/').pop();
    e.preventDefault();
    if ($('#postText').val().trim() === '') {
      return;
    }
    socket.emit('createPost', $(this).serialize() + userId);
    $('#postText').val('');
  });
  socket.on('createPost', function(data) {
    var newPost = $(data.html);
    $('#postCarousel .carousel-inner .active').removeClass('active');
    $('#postCarousel .carousel-inner').prepend(newPost);
  });
  $('#commentPost').on('submit', function(e) {
    var postId = '&postId=' + this.action.split('/').pop();
    e.preventDefault();
    if ($('#commentText').val().trim() === '') {
      return;
    }
    socket.emit('commentPost', $(this).serialize() + postId);
    $('#commentText').val('');
  });
  socket.on('commentPost', function(data) {
    $('#postCarousel .carousel-inner .active').removeClass('active');
    $('#post'+data.postId).replaceWith(data.html);
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

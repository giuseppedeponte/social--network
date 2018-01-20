var socket = io();
var ownUserId = '';
window.onbeforeunload = function() {
  socket.disconnect();
};
socket.emit('Handshake++', 'Ping');
socket.on('Handshake++', function(data) {
  ownUserId = data;
  $('.friendA[href="/user/' + ownUserId + '"] .btn').remove();
  $('.friendA[href="/user/' + ownUserId + '"]')
    .addClass('list-group-item-success');
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
    $('#postCount').text($('.carousel-item').length);
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
    $('#post' + data.postId).replaceWith(data.html);
  });
  $('a.deletePost').click(function(e) {
    e.preventDefault();
    var postId = this.href.split('/').pop();
    socket.emit('deletePost', postId);
  });
  socket.on('deletePost', function(postId) {
    $('#post' + postId).remove();
    $('.carousel-item').first().addClass('active');
    $('#postCount').text($('.carousel-item').length);
  });
  $('.friendA').click(function(e) {
    if ($(e.target).hasClass('btn') || $(e.target).parent().hasClass('btn')) {
      e.preventDefault();
    }
  });
  // ADD FRIEND
  var addFriend = function(e) {
    var personId = $(this).parent('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('addFriend', personId);
  };
  $('.addFriend').on('click', addFriend);
  socket.on('addFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"] .btn')
      .children(':first')
      .removeClass('fa-plus')
      .addClass('fa-cog fa-spin');
    $('.friendA[href="/user/' + friendId + '"]')
      .removeClass('friendA')
      .addClass('list-group-item-secondary');
  });
  // CONFIRM FRIEND
  var confirmFriend = function(e) {
    var personId = $(this).parent('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('confirmFriend', personId);
  };
  $('.confirmFriend').on('click', confirmFriend);
  socket.on('confirmFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"] .btn')
      .remove();
    $('.friendA[href="/user/' + friendId + '"]')
      .removeClass('list-group-item-warning');
  });
  // REMOVE FRIEND
  var removeFriend = function(e) {
    var personId = $(this).parent('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('removeFriend', personId);
  };
  $('.removeFriend').on('click', removeFriend);
  socket.on('removeFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"]').remove();
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
    $('.friendA').click(function(e) {
      if ($(e.target).hasClass('btn') || $(e.target).parent().hasClass('btn')) {
        e.preventDefault();
      }
    });
  });
});

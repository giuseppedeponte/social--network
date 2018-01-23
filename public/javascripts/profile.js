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
    $('.friendItem').removeClass('d-none').addClass('d-flex');
  });
  $('#friendSearchForm').on('submit', function(e) {
    e.preventDefault();
    if ($('#friendSearch').val().trim() === '') {
      $('.friendSearchItem').remove();
      $('#friendSearchInfo small').addClass('invisible');
      $('#friendSearchInfo small span').text('');
      $('.friendItem').removeClass('d-none').addClass('d-flex');
      return;
    }
    var q = $(this).serialize();
    socket.emit('friendSearch', q);
  });
  socket.on('friendSearch', function(users) {
    $('.friendSearchItem').remove();
    $('.friendItem').removeClass('d-flex').addClass('d-none');
    var u = null;
    for (var i = 0; users[i]; i++) {
      u = users[i];
      var friendItem = $(
        $('#friendSearchItem')
        .prop('outerHTML')
        .replace(new RegExp('{{ name }}', 'g'), u.name || u.email)
        .replace(new RegExp('{{ id }}', 'g'), u._id)
      )
      .addClass('friendSearchItem')
      .insertAfter('#friendSearchItem');
      if (u.relation === 'friend') {
        if (u.role !== 'admin') {
          friendItem
          .children('.btn')
          .addClass('removeFriend btn-danger')
          .on('click', removeFriend)
          .children('.btn i')
          .addClass('fa-minus');
        } else {
          friendItem
          .children('.btn')
          .remove();
        }
      } else if (u.relation === 'requestReceived') {
        friendItem
        .addClass('list-group-item-warning')
        .children('.btn')
        .addClass('confirmFriend btn-success')
        .on('click', confirmFriend)
        .children('.btn i')
        .addClass('fa-check');
      } else if (u.relation === 'requestSent') {
        friendItem
        .addClass('list-group-item-secondary')
        .children('.btn')
        .attr('disabled', 'disabled')
        .children('.btn i')
        .addClass('fa-cog fa-spin');
      } else {
        friendItem
        .addClass('list-group-item-info')
        .children('.btn')
        .addClass('addFriend btn-dark')
        .on('click', addFriend)
        .children('.btn i')
        .addClass('fa-plus');
      }
      console.log(friendItem.children('.btn i'));
      friendItem
      .addClass('d-flex')
      .removeClass('d-none')
      .attr('id', '')
      .click(function(e) {
        if ($(e.target).hasClass('btn') || $(e.target).parent().hasClass('btn')) {
          e.preventDefault();
        }
      });
    }
    $('#friendSearchInfo small span').text((users.length) + ' utilisateurs trouvés.');
    $('#friendSearchInfo small').removeClass('invisible');
    $('.friendA').click(function(e) {
      if ($(e.target).hasClass('btn') || $(e.target).parent().hasClass('btn')) {
        e.preventDefault();
      }
    });
  });
});

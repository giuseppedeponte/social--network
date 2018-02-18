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
    if ($(e.target).hasClass('btn') || $(e.target).parents().hasClass('btn')) {
      e.preventDefault();
    }
  });
  // ADD FRIEND
  var addFriend = function(e) {
    var personId = $(this).parents('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('addFriend', personId);
  };
  $('.addFriend').on('click', addFriend);
  socket.on('addFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"] .btn')
      .removeClass('btn-dark')
      .removeClass('addFriend')
      .attr('disabled', 'disabled')
      .attr('title', 'Invitation en cours')
      .children(':first')
      .removeClass('fa-plus')
      .addClass('fa-cog fa-spin');
    $('.friendA[href="/user/' + friendId + '"]')
      .addClass('friendA')
      .addClass('friendItem')
      .removeClass('friendSearchItem')
      .removeClass('list-group-item-info')
      .addClass('list-group-item-secondary');
  });
  // CONFIRM FRIEND
  var confirmFriend = function(e) {
    var personId = $(this).parents('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('confirmFriend', personId);
  };
  $('.confirmFriend').on('click', confirmFriend);
  socket.on('confirmFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"] .refuseFriend').remove();
    var friendItem = $('.friendA[href="/user/' + friendId + '"]');
    friendItem
    .find('.btn')
    .first()
    .clone()
    .appendTo(friendItem.find('.btn-group'))
    .addClass('shareFriend btn-warning')
    .attr('title', 'Envoyer une recommandation d\'ajout à la liste d\'amis')
    .off('click', confirmFriend)
    .on('click', shareFriend)
    .find('i')
    .addClass('fa-share');
    friendItem
    .find('.btn')
    .first()
    .clone()
    .appendTo(friendItem.find('.btn-group'))
    .addClass('removeFriend btn-danger')
    .attr('title', 'Supprimer de la liste d\'amis')
    .off('click', confirmFriend)
    .on('click', removeFriend)
    .children('.btn i')
    .addClass('fa-minus');
    friendItem
    .find('.btn')
    .first()
    .removeClass('confirmFriend btn-success')
    .addClass('chatRequest btn-info')
    .attr('title', 'Inviter à rejoindre une conversation instantanée')
    .off('click', confirmFriend)
    .on('click', chatRequest)
    .find('i')
    .addClass('fa-commenting');

    $('.friendA[href="/user/' + friendId + '"]')
      .removeClass('list-group-item-warning');
  });
  // REFUSE FRIEND
  var refuseFriend = function(e) {
    var personId = $(this).parents('a').attr('href').split('/')[2];
    if (personId === ownUserId) {
      return;
    }
    socket.emit('refuseFriend', personId);
  };
  $('.refuseFriend').on('click', refuseFriend);
  socket.on('refuseFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"]').remove();
  });
  // REMOVE FRIEND
  var removeFriend = function(e) {
    var personId = $(this).parents('a').attr('href').split('/')[2];
    var ownerId = window.location.pathname.split('/').pop();
    if (personId === ownUserId) {
      return;
    }
    socket.emit('removeFriend', personId, ownerId);
  };
  $('.removeFriend').on('click', removeFriend);
  socket.on('removeFriend', function(friendId) {
    $('.friendA[href="/user/' + friendId + '"]').remove();
  });
  var sendFriendRecommandation = function(e) {
    e.preventDefault();
    var friendA = $(e.target).attr('data-friend');
    var friendB = $(e.target).attr('href').split('/').pop();
    socket.emit('shareFriend', friendA, friendB, ownUserId);
  };
  socket.on('shareFriend', function(data) {
    console.log(data);
  });
  var shareFriend = function(e) {
    var personId = $(this).parents('a').attr('href').split('/')[2];
    $('#shareFriendModal #shareFriendWith a')
    .show()
    .attr('data-friend', personId);
    $('#shareFriendModal #shareFriendWith a[href="/share/' + personId + '"]')
    .hide();
    $('#shareFriendModal').modal('show');
    console.log($('#shareFriendModal'));
  };
  $('.shareFriend').on('click', shareFriend);
  $('#shareFriendWith a').on('click', sendFriendRecommandation);
  var addShareDropdown = function(element) {

  };
  var chatRequest = function(e) {};
  $('.chatRequest').on('click', chatRequest);
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
    console.log(users);
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
      if (u.image) {
        friendItem.find('img').attr('src', u.image);
      }
      if (u.relation === 'friend' || u.relation === 'admin') {
        if (u.role !== 'admin' && u.relation !== 'admin') {
          friendItem
          .find('.btn')
          .first()
          .clone()
          .appendTo(friendItem.find('.btn-group'))
          .addClass('shareFriend btn-warning')
          .attr('title', 'Envoyer une recommandation d\'ajout à la liste d\'amis')
          .off('click', confirmFriend)
          .on('click', shareFriend)
          .find('i')
          .addClass('fa-share');
          friendItem
          .find('.btn')
          .first()
          .clone()
          .appendTo(friendItem.find('.btn-group'))
          .addClass('removeFriend btn-danger')
          .attr('title', 'Supprimer de la liste d\'amis')
          .off('click', confirmFriend)
          .on('click', removeFriend)
          .children('.btn i')
          .addClass('fa-minus');
          friendItem
          .find('.btn')
          .first()
          .addClass('chatRequest btn-info')
          .attr('title', 'Inviter à rejoindre une conversation instantanée')
          .off('click', confirmFriend)
          .on('click', chatRequest)
          .find('i')
          .addClass('fa-commenting');
        } else {
          friendItem
          .find('.btn')
          .remove();
        }
      } else if (u.relation === 'requestReceived') {
        friendItem.addClass('list-group-item-warning');
        friendItem
        .find('.btn')
        .clone()
        .appendTo(friendItem.find('.btn-group'))
        .addClass('refuseFriend btn-dark')
        .attr('title', 'Refuser la demande')
        .on('click', refuseFriend)
        .find('i')
        .addClass('fa-close')
        friendItem
        .find('.btn')
        .first()
        .addClass('confirmFriend btn-success')
        .attr('title', 'Ajouter à la liste d\'amis')
        .on('click', confirmFriend)
        .find('i')
        .addClass('fa-check');
      } else if (u.relation === 'requestSent') {
        friendItem
        .addClass('list-group-item-secondary')
        .find('.btn')
        .attr('disabled', 'disabled')
        .attr('title', 'Invitation en cours')
        .find('i')
        .addClass('fa-cog fa-spin');
      } else {
        friendItem
        .addClass('list-group-item-info')
        .find('.btn')
        .addClass('addFriend btn-dark')
        .attr('title', 'Envoyer une invitation')
        .on('click', addFriend)
        .find('i')
        .addClass('fa-plus');
      }
      friendItem
      .addClass('d-flex')
      .removeClass('d-none')
      .attr('id', '')
      .click(function(e) {
        if ($(e.target).hasClass('btn') || $(e.target).parents().hasClass('btn')) {
          e.preventDefault();
        }
      });
    }
    $('#friendSearchInfo small span').text((users.length) + ' utilisateurs trouvés.');
    $('#friendSearchInfo small').removeClass('invisible');
    $('.friendA').click(function(e) {
      if ($(e.target).hasClass('btn') || $(e.target).parents().hasClass('btn')) {
        e.preventDefault();
      }
    });
  });
});

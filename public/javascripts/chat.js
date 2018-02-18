var CONVERSATION = null;
var chatRequest = function(e) {
  var personId = $(this).parents('a').attr('href').split('/')[2];
  var personName = $(this).parents('a').attr('data-friend');
  socket.emit('outgoingCall', {
    caller: ownUserId,
    callee: personId
  });
  $('#chatModal').attr('data-friend', personId);
  $('#acceptCall').hide();
  $('#refuseCall').hide();
  $('#chatForm').hide();
  $('#chatMessages').hide();
  $('#chatModal').modal('show');
};
var acceptCall = function(e) {
  var friendId = $('#chatModal').attr('data-friend');
  socket.emit('callAccepted', {
    caller: friendId,
    callee: ownUserId
  });
};
var refuseCall = function(e) {
  var friendId = $('#chatModal').attr('data-friend');
  socket.emit('callRefused', {
    caller: friendId,
    callee: ownUserId
  });
  $('#chatModal').modal('hide');
};
$(function() {
  var emptyModal = $('#chatModal').clone();
  var emptyMessage = $('#chatModal .chatMessage').first();
  var typeSpyTimeout = null;
  // Reset modal on close
  $('#chatModal').on('hide.bs.modal', function() {
    if (CONVERSATION) {
      socket.emit('hangUp', CONVERSATION);
      CONVERSATION = null;
    }
    $('#chatModal').html(emptyModal.html());
    $('#chatForm').on('submit', function(e) {
      e.preventDefault();
      var message = $('#chatMessage').val();
      if (message) {
        socket.emit('incomingMessage', {
          conversation: CONVERSATION,
          message: message
        });
      }
      $('#chatMessage').val('');
    });
    $('#chatMessage').on('keyup', function(e) {
      socket.emit('typing', CONVERSATION);
    });
  });
  $('#chatForm').on('submit', function(e) {
    e.preventDefault();
    var message = $('#chatMessage').val();
    if (message) {
      socket.emit('incomingMessage', {
        conversation: CONVERSATION,
        message: message
      });
    }
    $('#chatMessage').val('');
  });
  $('#chatMessage').on('keyup', function(e) {
    socket.emit('typing', CONVERSATION);
  });
  socket.on('typing', function(username) {
    if (typeSpyTimeout) {
      clearTimeout(typeSpyTimeout);
    }
    $('#typeSpy').html(username + ' est en train d\'écrire...');
    typeSpyTimeout = setTimeout(function() {
      $('#typeSpy').html(' ');
    }, 600);
  });
  socket.on('incomingCall', function(conversation) {
    if (CONVERSATION) {
      socket.emit('hangUp', conversation);
      return;
    }
    CONVERSATION = conversation;
    var text = (conversation.caller.name || conversation.caller.email) + ' veut démarrer une conversation instantanée avec vous.';
    $('#chatAlert').text(text);
    $('#chatForm').hide();
    $('#chatMessages').hide();
    $('#chatModal').attr('data-friend', conversation.caller._id);
    $('#acceptCall').show();
    $('#refuseCall').show();
    $('#chatModal').modal('show');
    $('#refuseCall').on('click', refuseCall);
    $('#acceptCall').on('click', acceptCall);
  });
  socket.on('callStart', function(conversation) {
    CONVERSATION = conversation;
    $('#chatAlert').text('La conversation a été acceptée. Écrivez quelque-chose pour commencer.');
    $('#chatFriend').text('Conversation avec ' + (conversation.caller._id === ownUserId ? conversation.callee.name : conversation.caller.name));
    $('#chatForm').show();
    $('#chatMessages').show();
    $('#acceptCall').hide();
    $('#refuseCall').hide();
  });
  socket.on('callRefused', function(conversation) {
    CONVERSATION = null;
    $('#chatAlert').text('La conversation a été refusée.');
    $('#acceptCall').hide();
    $('#refuseCall').hide();
  });
  socket.on('incomingMessage', function(conversation) {
    CONVERSATION = conversation;
    if (typeSpyTimeout) {
      clearTimeout(typeSpyTimeout);
    }
    $('#typeSpy').html(' ');
    $('#chatAlert').hide();
    $('#chatModal .chatMessage').remove();
    for (var i = 0; conversation.messages[i]; i += 1) {
      var message = conversation.messages[i];
      var m = emptyMessage.clone();
      var color = message.personId === ownUserId ? 'alert-info': 'alert-secondary';
      var align = message.personId === ownUserId ? 'text-left mr-4' : 'text-right ml-4';
      m.children('span').text(message.text);
      m.addClass(align).addClass(color).appendTo('#chatMessages');
    }
  });
  socket.on('hangUp', function() {
    CONVERSATION = null;
    $('#chatAlert').text('La conversation a été interrompue.').show();
  });
  socket.on('disconnect', function() {
    socket.emit('hangUp', CONVERSATION);
  });
  socket.on('error', function() {
    socket.emit('hangUp', CONVERSATION);
  });
});

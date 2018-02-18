var CONVERSATION = null;
var chatRequest = function(e) {
  var personId = $(this).parents('a').attr('href').split('/')[2];
  var personName = $(this).parents('a').attr('data-friend');
  console.log(personId);
  console.log(ownUserId);
  socket.emit('outgoingCall', {
    caller: ownUserId,
    callee: personId
  });
  $('#chatModal').attr('data-friend', personId);
  $('#chatModal .modal-footer').hide();
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
  console.log('callRefused');
  var friendId = $('#chatModal').attr('data-friend');
  socket.emit('callRefused', {
    caller: friendId,
    callee: ownUserId
  });
  $('#chatModal').modal('hide');
};
$(function() {
  var emptyModal = $('#chatModal').clone();
  var emptyMessage = $('#chatModal .chatMessage').first().clone();
  // Reset modal on close
  $('#chatModal').on('hide.bs.modal', function() {
    if (CONVERSATION) {
      socket.emit('hangUp', CONVERSATION);
      CONVERSATION = null;
    }
    $('#chatModal').html(emptyModal.html());
  });
  $('#chatForm').on('submit', function(e) {
    e.preventDefault();
    var message = $('#chatMessage').val();
    if (message) {
      socket.emit('incomingMessage', {
        userId: ownUserId,
        message: message
      });
    }
    $('#chatMessage').val('');
  });
  // incoming call
  socket.on('incomingCall', function(conversation) {
    if (CONVERSATION) {
      socket.emit('hangUp', conversation);
      return;
    }
    CONVERSATION = conversation;
    var text = (conversation.caller.name || conversation.caller.email) + ' veut démarrer une converation instantanée avec vous.';
    $('#chatAlert').text(text);
    $('#chatForm').hide();
    $('#chatMessages').hide();
    $('#chatModal').attr('data-friend', conversation.caller._id);
    $('#chatModal .modal-footer').show();
    $('#chatModal').modal('show');
    $('#refuseCall').on('click', refuseCall);
    $('#acceptCall').on('click', acceptCall);
  });
  socket.on('callStart', function(conversation) {
    CONVERSATION = conversation;
    $('#chatAlert').text('La conversation a été acceptée. Écrivez quelque-chose pour commencer.');
    $('#chatModal .modal-footer').hide();
  });
  socket.on('callRefused', function(conversation) {
    CONVERSATION = null;
    $('#chatAlert').text('La conversation a été refusée.');
    $('#chatModal .modal-footer').hide();
  });
  socket.on('incomingMessage', function(conversation) {
    CONVERSATION = conversation;
    $('#chatModal .chatMessage').remove();
    for (var i = 0; conversation.messages[i]; i += 1) {
      var message = conversation.messages[i];
      emptyMessage.clone().text(message.person + ' : ' + message.text);
      emptyMessage.appendTo('#chatMessages');
    }
  });
  socket.on('hangUp', function() {
    CONVERSATION = null;
    $('#chatAlert').text('La conversation a été interrompue.').show();
  });
});

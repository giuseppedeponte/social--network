'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const conversationSchema = Schema({
  caller: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  callee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    default: 'waiting'
  },
  messages: [{
    person: String,
    text: String
  }],
  socket: Object
});
module.exports = mongoose.model('Conversation', conversationSchema);

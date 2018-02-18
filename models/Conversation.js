'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const conversationSchema = Schema({
  date: Date,
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
    personId: String,
    person: String,
    text: String
  }]
});
module.exports = mongoose.model('Conversation', conversationSchema);

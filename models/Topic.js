'use strict';
const mongoose = require('mongoose');
const emailer = require('../config/email');
const Schema = mongoose.Schema;
const topicSchema = Schema({
  date: Date,
  subject: String,
  messages: [{
    author: String,
    text: String,
    date: Date
  }],
  subscribers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});
topicSchema.post('save', function(doc, next) {
  doc
  .populate({
    path: 'subscribers',
    select: 'email'
  })
  .execPopulate()
  .then((doc) => {
    doc.subscribers.map((person) => {
      emailer.send({
        to: person.email,
        subject: doc.subject,
        text: 'Un nouveau message vient d\'être publié sur le fil de discussion : "' + doc.subject + '".'
      });
    });
    next();
  })
  .catch((err) => {
    console.log(err);
    next();
  })
});
module.exports = mongoose.model('Topic', topicSchema);

'use strict';
const mongoose = require('mongoose');
const emailer = require('../config/email');
const Schema = mongoose.Schema;
const topicSchema = Schema({
  date: Date,
  publisher: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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
  .populate('subscribers')
  .execPopulate()
  .then((doc) => {
    let updatees = [];
    doc.subscribers.map((person) => {
      let isNew = person.topics.indexOf(doc._id) === -1;
      emailer.send({
        to: person.email,
        subject: doc.subject,
        text: isNew
              ? 'Vous avez été invité à rejoindre le fil de discussion "' + doc.subject +'".'
              : 'Le fil de discussion : "' + doc.subject + '" auquel vous participez vient d\'être mis à jour.'
      });
      if (isNew) {
        person.topics.push(doc._id);
        updatees.push(person.save());
      }
    });
    return Promise.all(updatees);
  })
  .then(() => {
    next();
  })
  .catch((err) => {
    console.log(err);
    next();
  })
});
module.exports = mongoose.model('Topic', topicSchema);

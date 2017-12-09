'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  author: String,
  text: String,
  date: Date,
  comments: [
    {
      text: String,
      author: String
    }
  ]
});
module.exports = mongoose.model('Post', postSchema);

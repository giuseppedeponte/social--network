'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const userRoles = ['guest', 'user', 'admin'];
const Post = require('../models/Post');
const Schema = mongoose.Schema;
const userSchema = Schema({
  email: {
    type: String,
    lowercase: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: userRoles,
    default: 'user'
  },
  name: String,
  info: {
    firstName: String,
    lastName: String,
    gender: String,
    address: {
      street: String,
      zipCode: String,
      city: String,
      state: String
    },
    age: {
      type: Number,
      min: 0
    }
  },
  profile: {
    image: String,
    bio: String,
    preferences: String
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: {
    sent: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    received: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  socket: {
    type: String,
    default: ''
  }
});
// CONNECTION
userSchema.methods.updateSocket = function(socket) {
  socket = socket || '';
  this.socket = socket;
  return this.save();
};
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};
userSchema.methods.hasFriend = function(userId) {
  return this.friends.some((friend) => {
    return friend.equals(userId);
  });
};
// BLOGGING
userSchema.methods.createPost = function(postText, postAuthor) {
  let post = new Post({
    text: postText.trim(),
    author: postAuthor.trim(),
    user: this._id,
    date: Date.now(),
    comments: []
  });
  return post.save()
  .then(() => {
    this.posts.unshift(post);
    return this.save();
  });
};
userSchema.methods.commentPost = function(commentText, commentAuthor, postId) {
  let post;
  return Post.findOne({'_id': postId})
  .then((p) => {
    post = p;
    post.comments.unshift({
      author: commentAuthor,
      text: commentText.trim()
    });
    return post.save();
  });
};
userSchema.methods.deletePost = function(postId) {
  this.posts.filter((post) => {
    return post != postId;
  });
  return this.save()
  .then(() => {
    return Post.remove({ '_id': postId});
  });
};
module.exports = mongoose.model('User', userSchema);

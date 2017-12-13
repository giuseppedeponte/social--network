'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const userRoles = ['guest', 'user', 'admin'];
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
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  socket: {
    type: String,
    default: ''
  }
});
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
  return this.role >= role;
};
userSchema.methods.hasFriend = function(userId) {
  return this.friends.some((friend) => {
    return friend.equals(userId);
  });
};
module.exports = mongoose.model('User', userSchema);

'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
var userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String,
    role: Number
  }
});
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};
module.exports = mongoose.model('User', userSchema);

'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};

passport.use('local-signup',new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  process.nextTick(() => {
    User.findOne({'local.email': email}, (err, user) => {
      if (err) {
        return done(err);
      }
      if (user) {
        return done(null, false, req.flash('signupMessage', 'Un utilisateur avec cet adresse email existe déjà.'));
      }
      let newUser = new User();
      newUser.local.email = email;
      newUser.local.password = newUser.generateHash(password);
      newUser.save((err) => {
        if (err) {
          throw err;
        }
        return done(null, newUser);
      });
    });
  });
}));
passport.use('local-login',new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  User.findOne({'local.email': email}, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, req.flash('loginMessage', 'Aucun utilisateur existe avec cet adresse email'));
    }
    if (!user.validPassword(password)) {
      return done(null, false, req.flash('loginMessage', 'Mot de passe incorrect.'));
    }
    return done(null, user);
  });
}));

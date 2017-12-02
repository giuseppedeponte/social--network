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
  User.findOne({'email': email})
  .then((user) => {
    if (user) {
      return done(null, false, req.flash('signupMessage', 'Un utilisateur avec cet adresse email existe déjà.'));
    }
    let newUser = new User();
    newUser.email = email;
    newUser.password = newUser.generateHash(password);
    newUser.save((err) => {
      if (err) {
        console.log(err);
        throw err;
      }
      return done(null, newUser);
    });
  })
  .catch((err) => {
    return done(err);
  });
}));
passport.use('local-login',new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  User.findOne({'email': email})
  .then((user) => {
    if (!user) {
      return done(null, false, req.flash('loginMessage', 'Aucun utilisateur existe avec cet adresse email'));
    }
    if (!user.validPassword(password)) {
      return done(null, false, req.flash('loginMessage', 'Mot de passe incorrect.'));
    }
    return done(null, user);
  })
  .catch((err) => {
    console.log(err);
    return done(err);
  });
}));

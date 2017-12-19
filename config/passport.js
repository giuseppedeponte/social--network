'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@social-network.fr';
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
  email = email.trim().toLowerCase();
  password = password.trim();
  req.body.passwordRepeat = req.body.passwordRepeat.trim();
  if (email === '' || password === '' || req.body.passwordRepeat === '') {
    return done(null, false, req.flash('signupMessage', 'Merci de remplir tous les champs du formulaire.'));
  } else if (password !== req.body.passwordRepeat) {
    return done(null, false, req.flash('signupMessage', 'Les deux mots de passe ne correspondent pas.'));
  }
  User.findOne({'email': email})
  .then((user) => {
    if (user) {
      return done(null, false, req.flash('signupMessage', 'Un utilisateur avec cet adresse email existe déjà.'));
    }
    let newUser = new User();
    newUser.email = email;
    newUser.password = newUser.generateHash(password);
    console.log(email);
    newUser.role = email === ADMIN_EMAIL ? 'admin' : 'user';
    if (newUser.role === 'admin') {
      newUser.save((err, savedUser) => {
        if (err) {
          console.log(err);
          throw err;
        }
        return done(null, savedUser);
      });
    } else {
      User
      .findOne({'email': ADMIN_EMAIL })
      .then((admin) => {
        newUser.friends.push(admin);
        newUser.save((err, savedUser) => {
          if (err) {
            console.log(err);
            throw err;
          }
          admin.friends.push(savedUser);
          admin.save((err) => {
            if (err) {
              console.log(err);
              throw err;
            }
            return done(null, savedUser);
          });
        });
      });
    }
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
  email = email.toLowerCase();
  if (email === '' || password === '') {
    return done(null, false, req.flash('loginMessage', 'Merci de remplir tous les champs du formulaire.'));
  }
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

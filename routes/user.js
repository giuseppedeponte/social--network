'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const router = express.Router();
const User = require('../models/User');
router.get('/', auth.loggedIn, (req, res, next) => {
  res.redirect('/user/' + req.user._id);
});
router.get('/login', (req, res, next) => {
  res.render('login', {
    title: 'Connexion',
    message: req.flash('loginMessage')
  });
});
router.get('/signup', (req, res, next) => {
  res.render('signup', {
    title: 'Inscription',
    message: req.flash('signupMessage')
  });
});
router.get('/logout', (req, res, next) => {
  req.logout();
  req.flash('indexMessage', 'Vous êtes bien déconnectés.');
  res.redirect('/');
});
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/user',
  failureRedirect: '/user/signup',
  failureFlash: true
}));
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/user',
  failureRedirect: '/user/login',
  failureFlash: true
}));
router.get('/:userId', auth.friend, (req, res, next) => {
  if (req.isOwner) {
    res.render('profile', {
      title: 'Profile',
      user: req.user
    });
  } else {
    User.findOne({'_id': req.params.userId})
    .then((user) => {
      if (!user) {
        throw new Error('Not Found');
      }
      res.render('profile', {
        title: 'Profile',
        user: user
      });
    })
    .catch((e) => {
      res.redirect('/404');
    });
  }
});
module.exports = router;

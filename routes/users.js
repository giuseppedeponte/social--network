'use strict';
const express = require('express');
const passport = require('passport');
const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next;
  }
  res.redirect('/');
};
router.get('/', (req, res, next) => {
  res.render('profile', {
    title: 'Profile',
    user: req.user
  });
});
router.get('/login', (req, res, next) => {
  res.render('login', {
    title: 'Login',
    message: req.flash('loginMessage')
  });
});
router.get('/signup', (req, res, next) => {
  res.render('signup', {
    title: 'Signup',
    message: req.flash('signupMessage')
  });
});
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/users/',
  failureRedirect: '/users/signup',
  failureFlash: true
}));
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/users/',
  failureRedirect: '/users/login',
  failureFlash: true
}));
module.exports = router;

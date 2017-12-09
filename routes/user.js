'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
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
router.get('/edit/:userId', auth.owner, (req, res, next) => {
  User.findOne({'_id': req.params.userId})
  .populate({
    path: 'posts',
    sort: { date: -1 }
  })
  .exec()
  .then((user) => {
    res.render('editProfile', {
      title: 'Profile',
      user: user,
      viewer: req.user,
      isOwner: req.isOwner,
      isFriend: req.isFriend,
      isAdmin: req.isAdmin
    });
  })
  .catch((e) => {
    res.redirect('/404');
  });
});
router.post('/update/:userId', auth.owner, (req, res, next) => {
  User.findOne({'_id': req.params.userId})
  .then((user) => {
    if (!user) {
      throw new Error('Not Found');
    }
    req.user.name = req.body.name.trim()
                    || req.user.name;
    req.user.email = req.body.email.trim().toLowerCase()
                     || req.user.email;
    req.user.info.firstName = req.body.firstName.trim()
                              || req.user.info.firstName;
    req.user.info.lastName = req.body.lastName.trim()
                     || req.user.info.lastName;
    req.user.info.gender = req.body.gender.trim().toLowerCase()
                     || req.user.info.gender;
    req.user.info.address.street = req.body.street.trim()
                     || req.user.info.address.street;
    req.user.info.address.zipCode = req.body.zipCode.trim()
                     || req.user.info.address.zipCode;
    req.user.info.address.city = req.body.city.trim()
                     || req.user.info.address.city;
    req.user.info.address.state = req.body.state.trim()
                     || req.user.info.address.state;
    req.user.profile.bio = req.body.bio.trim()
                     || req.user.profile.bio;
    req.user.profile.preferences = req.body.preferences.trim()
                     || req.user.profile.preferences;
    req.user.save((err, user) => {
      if (err) {
        throw err;
      }
      req.flash('profileMessage', 'Les modifications ont bien été sauvegardées.' )
      res.redirect('/user/' + req.params.userId);
    });
  })
  .catch((e) => {
    req.flash('profileMessage', 'Oops, les modifications n\'ont pas pu être sauvegardées.' )
    res.redirect('/user/edit/' + req.params.userId);
  });
});
router.get('/:userId', auth.friend, (req, res, next) => {
  User.findOne({'_id': req.params.userId})
  .populate({
    path: 'posts',
    sort: { date: -1 }
  })
  .exec()
  .then((user) => {
    res.render('profile', {
      title: 'Profile',
      user: user,
      viewer: req.user,
      isOwner: req.isOwner,
      isFriend: req.isFriend,
      isAdmin: req.isAdmin
    });
  })
  .catch((e) => {
    res.redirect('/404');
  });
});
module.exports = router;

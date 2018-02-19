'use strict';
const crypto = require('crypto');
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const emailer = require('../config/email');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const multer = require('multer');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const upload = multer({
  limits: {
    fileSize: 500000
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('bad image type'));
    }
  }
});
const avatarUpload = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (!req.file) {
      return next();
    }
    if (err) {
      req.flash('updateMessage', 'Oops, les modifications n\'ont pas pu être sauvegardées.');
      res.redirect('/user/edit/' + req.params.userId);
    } else {
      if (req.params.userId && req.file) {
        let key = req.params.userId + '/' + Date.now() + '.' + req.file.originalname.split('.').pop();
        S3.putObject({
          Body: req.file.buffer,
          Bucket: process.env.S3_BUCKET,
          Key: key,
          ContentType: req.file.mimetype,
          ACL: 'public-read'
        }, (er, data) => {
          if (er) {
            console.log(er);
          } else {
            req.body.avatarUrl = S3.endpoint.href + process.env.S3_BUCKET + '/' + key;
          }
          next();
        });
      }
    }
  });
}
router.get('/', auth.loggedIn, (req, res, next) => {
  res.redirect('/user/' + req.user._id);
});
router.get('/login', (req, res, next) => {
  res.render('login', {
    viewer: '',
    title: 'Connexion',
    message: req.flash('loginMessage')
  });
});
router.get('/signup', (req, res, next) => {
  res.render('signup', {
    viewer: '',
    title: 'Inscription',
    message: req.flash('signupMessage')
  });
});
router.get('/reset', (req, res, next) => {
  res.render('reset', {
    viewer: '',
    title: 'Réinitialisation du mot de passe',
    message: req.flash('resetMessage')
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
router.post('/reset', (req, res, next) => {
  let email = req.body.email.toLowerCase();
  if (email === '') {
    req.flash('resetMessage', 'Merci d\'indiquer une adresse email');
    res.redirect('/user/reset');
    return;
  }
  User.findOne({'email': email})
  .then((user) => {
    if (!user) {
      req.flash('resetMessage', 'Aucun utilisateur existe avec cet adresse email');
      res.redirect('/user/reset');
      return;
    }
    crypto.randomBytes(20, (err, buf) => {
      if (err) {
        throw err;
      }
      let password = buf.toString('hex').substr(0,7);
      user.password = user.generateHash(password);
      emailer.send({
        to: user.email,
        subject: 'Votre nouveau mot de passe',
        text: password
      });
      user.save();
      req.flash('loginMessage', 'Un email vous a été envoyé avec vos nouveaux idéntifiants');
      res.redirect('/user/login');
    });
  })
  .catch((err) => {
    console.log(err);
    return done(err);
  });
});
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
      isAdmin: req.isAdmin,
      message: req.flash('updateMessage') || ''
    });
  })
  .catch((e) => {
    res.redirect('/404');
  });
});
router.post('/update/:userId', auth.owner, avatarUpload, (req, res, next) => {
  User.findOne({'_id': req.params.userId})
  .then((user) => {
    if (!user) {
      throw new Error('Not Found');
    }
    req.user.email = req.body.email.trim().toLowerCase() || req.user.email;
    req.user.name = typeof req.body.name !== 'undefined'
                    ? req.body.name.trim()
                    : req.user.name;
    req.user.info.firstName = typeof req.body.firstName !== 'undefined'
                              ? req.body.firstName.trim()
                              : req.user.info.firstName;
    req.user.info.lastName = typeof req.body.lastName !== 'undefined'
                              ? req.body.lastName.trim()
                              : req.user.info.lastName;
    req.user.info.gender = typeof req.body.gender !== 'undefined'
                            ? req.body.gender.trim().toLowerCase()
                            : req.user.info.gender;
    req.user.info.address.street = typeof req.body.street !== 'undefined'
                                    ? req.body.street.trim()
                                    : req.user.info.address.street;
    req.user.info.address.zipCode = typeof req.body.zipCode !== 'undefined'
                                    ? req.body.zipCode.trim()
                                    : req.user.info.address.zipCode;
    req.user.info.address.city = typeof req.body.city !== 'undefined'
                                  ? req.body.city.trim()
                                  : req.user.info.address.city;
    req.user.info.address.state = typeof req.body.state !== 'undefined'
                                  ? req.body.state.trim()
                                  : req.user.info.address.state;
    req.user.profile.image = typeof req.body.avatarUrl !== 'undefined'
                              ? req.body.avatarUrl
                              : req.user.profile.image;
    req.user.profile.bio = typeof req.body.bio !== 'undefined'
                            ? req.body.bio.trim()
                            : req.user.profile.bio;
    req.user.profile.preferences = typeof req.body.preferences !== 'undefined'
                                    ? req.body.preferences.trim()
                                    : req.user.profile.preferences;
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
router.get('/delete/:userId', auth.owner, (req, res, next) => {
  if (req.user._id.equals(req.params.userId) || req.user.role === 'admin') {
    User.remove({'_id': req.params.userId})
    .then(() => {
      req.logout();
      req.flash('indexMessage', 'Le compte a été supprimé');
      res.redirect('/');
    })
    .catch((e) => {
      req.flash('profileMessage', 'Oops, le compte n\'a pas pu être supprimé');
      res.redirect('/user/edit/' + req.params.userId);
    });
  }
});
router.get('/:userId', auth.friend, (req, res, next) => {
  res.io.once('connection', (socket) => {
    require('../websockets/profile').connect(res.io, socket, req.user);
  });
  User.findOne({'_id': req.params.userId})
  .populate({
    path: 'posts',
    sort: { date: -1 }
  })
  .populate('friends')
  .populate('friendRequests.sent')
  .populate('friendRequests.received')
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

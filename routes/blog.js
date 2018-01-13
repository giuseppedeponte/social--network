'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const router = express.Router();

router.post('/create/:userId', auth.friend, function(req, res) {
  if (req.body.postText && req.body.postAuthor && req.body.postAuthorId && req.params.userId) {
    let post;
    User.findOne({'_id': req.params.userId})
    .then((user) => {
      return user.createPost(req.body.postText, req.body.postAuthor, req.body.postAuthorId);
    })
    .then(() => {
      res.redirect('/user/' + req.params.userId);
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/user/' + req.params.userId);
    });
  } else {
    res.redirect('/user');
  }
});
router.post('/comment/:userId/:postId', auth.friend, function(req, res) {
  if (req.body.commentText && req.body.commentAuthor && req.params.postId) {
    req.user.commentPost(req.body.commentText, req.body.commentAuthor, req.params.postId)
    .then(() => {
      res.redirect('/user/' + req.params.userId);
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/user' + req.params.userId);
    });
  } else {
    res.redirect('/user' + req.params.userId);
  }
});
router.get('/delete/:userId/:postId', auth.owner, function(req, res) {
  if (req.params.postId) {
    User.findOne({'_id': req.params.userId})
    .then((user) => {
      user.deletePost(req.params.postId);
    })
    .then(() => {
      res.redirect('/user/' + req.params.userId);
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/user/' + req.params.userId);
    });
  } else {
    res.redirect('/user');
  }
});


module.exports = router;

'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const router = express.Router();

router.post('/create/:userId', auth.friend, function(req, res) {
  if (req.body.postText && req.body.postAuthor && req.params.userId) {
    let post, user;
    User.findOne({'_id': req.params.userId})
    .then((u) => {
      user = u;
      post = new Post({
        text: req.body.postText.trim(),
        author: req.body.postAuthor.trim(),
        user: user._id,
        date: Date.now(),
        comments: []
      });
      return post.save()
    })
    .then(() => {
      user.posts.unshift(post)
      return user.save();
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
    let post;
    Post.findOne({'_id': req.params.postId})
    .then((p) => {
      post = p;
      post.comments.unshift({
        author: req.body.commentAuthor,
        text: req.body.commentText.trim()
      });
      return post.save();
    })
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
      user.posts.filter((post) => {
        return post != req.params.postId;
      });
      return user.save();
    })
    .then(() => {
      return Post.remove({ '_id': req.params.postId});
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

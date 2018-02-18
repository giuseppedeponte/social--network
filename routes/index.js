'use strict';
const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const Topic = require('../models/Topic');
const Post = require('../models/Post');
const Conversation = require('../models/Conversation');

/* GET home page. */
router.get('/', function(req, res, next) {
  let stats = {};
  Promise.all([
    User
    .count()
    .then((number) => {
      stats.users = number;
    }),
    User
    .find({
      'socket': {
        $ne: ''
      }
    })
    .count()
    .then((number) => {
      stats.connections = number;
    }),
    Topic
    .count()
    .then((number) => {
      stats.topics = number;
    }),
    Post
    .count()
    .then((number) => {
      stats.posts = number;
    }),
    Conversation
    .count()
    .then((number) => {
      stats.chats = number;
    })
  ])
  .then(() => {
    console.log(stats);
    res.render('index', {
      title: 'Social Network',
      user: req.user || null,
      viewer: req.user || null,
      stats: stats,
      flashMessage: req.flash('flashMessage')
    });
  })
  .catch((err) => {
    console.log(err);
    res.render('index', {
      title: 'Social Network',
      user: req.user || null,
      viewer: req.user || null,
      flashMessage: req.flash('flashMessage')
    });
  })
});

module.exports = router;

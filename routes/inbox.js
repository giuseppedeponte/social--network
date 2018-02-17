'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@social-network.fr';
const User = require('../models/User');
const Topic = require('../models/Topic');

router.post('/create/:userId', auth.owner, (req, res, next) => {
  if (req.body && req.body.topicSubject) {
    req.body.topicSubscribers = req.body.topicSubscribers || [];
    let topic = new Topic({
      date: new Date(),
      publisher: req.user,
      subject: req.body.topicSubject,
      messages: req.body.topicMessage
                ? [{
                  author: req.user.name || req.user.email,
                  text: req.body.topicMessage,
                  date: new Date()
                }]
                : [],
      subscribers: typeof req.body.topicSubscribers === 'string'
                  ? [req.body.topicSubscribers]
                  : req.body.topicSubscribers
    });
    topic.subscribers.push(req.params.userId);
    User.findOne({ email: ADMIN_EMAIL })
    .then((admin) => {
      if (req.user.role !== 'admin') {
        topic.subscribers.push(admin._id);
      }
      return topic.save();
    })
    .then(() => {
      res.redirect('/inbox/' + req.params.userId);
    })
    .catch((err) => {
      console.log(err);
      req.flash('inboxMessage', 'Le fil de discussion n\'a pas pu être enregistré.');
      res.redirect('/inbox/' + req.params.userId);
    });
  } else {
    req.flash('inboxMessage', 'Veuillez indiquer un titre.');
    res.redirect('/inbox/' + req.params.userId);
  }
});
router.post('/update/:userId/:topicId', auth.owner, (req, res, next) => {
  if (req.body && req.params.userId && req.params.topicId && req.body.topicMessage) {
    Topic.findOne({ '_id': req.params.topicId })
    .then((topic) => {
      topic.messages.push({
        author: req.user.name || req.user.email,
        date: new Date(),
        text: req.body.topicMessage
      });
      return topic.save();
    })
    .then(() => {
      res.redirect('/inbox/' + req.params.userId);
    })
    .catch((err) => {
      res.redirect('/inbox/' + req.params.userId);
    });
  } else {
    res.redirect('/inbox/' + req.params.userId);
  }
});
router.get('/delete/:userId/:topicId', auth.owner, (req, res, next) => {
  Topic.findOne({ '_id': req.params.topicId })
  .then((topic) => {
    if (req.query.messageDate) {
      topic.messages = topic.messages.filter((message) => {
        console.log(message.date.valueOf(), req.query.messageDate);
        console.log(req.user.name, req.user.email, message.author);
        return !(String(message.date.valueOf()) === req.query.messageDate
                 && (req.user.role === 'admin'
                    || req.user.name === message.author
                    || req.user.email === message.author));
      });
      return topic.save();
    } else if (req.user.role === 'admin' || req.user._id.equals(topic.publisher)) {
      return Topic.remove({ '_id': req.params.topicId });
    } else {
      res.redirect('/inbox/' + req.params.userId);
      return;
    }
  })
  .then(() => {
    res.redirect('/inbox/' + req.params.userId);
  })
  .catch(() => {
    res.redirect('/inbox/' + req.params.userId);
  })
});
router.get('/:userId', auth.owner, (req, res, next) => {
  User.findOne({'_id': req.params.userId})
  .populate({
    path: 'topics',
    populate: {
      path: 'subscribers'
    },
    options: {
      sort: {
        date: -1
      }
    }
  })
  .populate('friends')
  .exec()
  .then((user) => {
    res.render('inbox', {
      title: 'Messagerie',
      user: user,
      viewer: user,
      isOwner: req.isOwner,
      isAdmin: req.isAdmin,
      message: req.flash('inboxMessage') || ''
    });
  })
  .catch((e) => {
    res.redirect('/404');
  });
});

module.exports = router;

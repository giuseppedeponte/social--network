'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const router = express.Router();
const User = require('../models/User');

router.get('/:userId', auth.owner, (req, res, next) => {
  let user = Object.assign({}, req.user);
  user.topics = [
    {
      date: new Date(),
      subject: 'Topic Subject',
      messages: [{
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.",
        date: new Date()
      },
      {
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch.",
        date: new Date()
      },
      {
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid.",
        date: new Date()
      }],
      subscribers: []
    },
    {
      date: new Date(),
      subject: 'Topic Subject',
      messages: [{
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.",
        date: new Date()
      },
      {
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch.",
        date: new Date()
      },
      {
        author: 'User',
        text: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid.",
        date: new Date()
      }],
      subscribers: []
    }
  ];
  res.render('inbox', {
    title: 'Messagerie',
    viewer: user,
    isOwner: req.isOwner,
    isFriend: req.isFriend,
    isAdmin: req.isAdmin,
    message: req.flash('inboxMessage') || ''
  });
});

module.exports = router;

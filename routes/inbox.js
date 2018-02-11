'use strict';
const express = require('express');
const passport = require('passport');
const auth = require('../config/auth');
const router = express.Router();
const User = require('../models/User');

router.get('/:userId', auth.owner, (req, res, next) => {
  res.render('inbox', {
    title: 'Messagerie',
    user: req.user,
    isOwner: req.isOwner,
    isFriend: req.isFriend,
    isAdmin: req.isAdmin,
    message: req.flash('inboxMessage') || ''
  });
});

module.exports = router;

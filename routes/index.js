'use strict';
const express = require('express');
const passport = require('passport');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Social Network',
    user: req.user || null,
    viewer: req.user || null,
    flashMessage: req.flash('flashMessage')
  });
});

module.exports = router;
